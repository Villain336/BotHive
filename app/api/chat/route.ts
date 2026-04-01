import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAnthropicClient, MODEL, MAX_TOKENS } from '@/lib/ai/client';
import { buildSystemPrompt } from '@/lib/ai/system-prompts';
import { chatTools } from '@/lib/ai/tools';
import {
  getFileContent,
  getRepoTree,
  parseGitHubUrl,
  createGitHubClient,
  createBranch,
  createOrUpdateFile,
  createPullRequest,
} from '@/lib/github';
import type { ScanCategory } from '@/lib/types';
import type Anthropic from '@anthropic-ai/sdk';

const MAX_TOOL_ITERATIONS = 10;

type MessageParam = Anthropic.MessageParam;
type ContentBlockParam = Anthropic.ContentBlockParam;

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value;

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { conversation_id, message, project_id, category } = body;

    if (!message || !project_id) {
      return new Response(JSON.stringify({ error: 'message and project_id are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load project
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load open findings for system prompt context
    const { data: findings } = await supabase
      .from('scan_findings')
      .select('*')
      .eq('project_id', project_id)
      .eq('status', 'open')
      .limit(20);

    // Get or create conversation
    let convId = conversation_id;
    if (!convId) {
      const { data: conv } = await supabase
        .from('conversations')
        .insert([{
          project_id,
          user_id: user.id,
          category: category || 'general',
          title: message.substring(0, 100),
          status: 'active',
        }])
        .select()
        .single();
      convId = conv?.id;
    }

    // Save user message
    if (convId) {
      await supabase.from('messages').insert([{
        conversation_id: convId,
        role: 'user',
        content: message,
      }]);
    }

    // Load conversation history
    let apiMessages: MessageParam[] = [];
    if (convId) {
      const { data: dbMessages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (dbMessages) {
        apiMessages = dbMessages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      }
    }

    // Ensure the new user message is at the end
    if (
      apiMessages.length === 0 ||
      apiMessages[apiMessages.length - 1].role !== 'user' ||
      (typeof apiMessages[apiMessages.length - 1].content === 'string' &&
        apiMessages[apiMessages.length - 1].content !== message)
    ) {
      apiMessages.push({ role: 'user', content: message });
    }

    // Build system prompt with project context
    const systemPrompt = buildSystemPrompt(
      (category as ScanCategory) || 'general',
      project,
      findings || []
    );

    // GitHub client for tool execution
    const { data: profile } = await supabase
      .from('profiles')
      .select('github_access_token')
      .eq('id', user.id)
      .single();

    const parsed = parseGitHubUrl(project.github_repo_url);
    const octokit = profile?.github_access_token
      ? createGitHubClient(profile.github_access_token)
      : null;

    // Repo tree cache for list_files tool
    let repoTreeCache: { path: string; type: string }[] | null = null;

    const anthropic = getAnthropicClient();
    const encoder = new TextEncoder();

    // --- Agentic loop via ReadableStream ---
    const readable = new ReadableStream({
      async start(controller) {
        function send(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        let fullAssistantText = '';
        let iterations = 0;

        try {
          // Agentic loop: keep calling Claude until it stops using tools
          while (iterations < MAX_TOOL_ITERATIONS) {
            iterations++;

            // Call Claude with streaming
            const stream = anthropic.messages.stream({
              model: MODEL,
              max_tokens: MAX_TOKENS,
              system: systemPrompt,
              messages: apiMessages,
              tools: chatTools,
            });

            // Collect the full response content blocks while streaming text deltas
            const contentBlocks: Anthropic.ContentBlock[] = [];
            let currentTextBlock = '';

            stream.on('text', (text) => {
              currentTextBlock += text;
              fullAssistantText += text;
              send({ type: 'text_delta', content: text });
            });

            const finalMessage = await stream.finalMessage();
            const stopReason = finalMessage.stop_reason;

            // Process all content blocks
            for (const block of finalMessage.content) {
              contentBlocks.push(block);
            }

            // If Claude stopped normally (no tool use), we're done
            if (stopReason === 'end_turn' || stopReason !== 'tool_use') {
              break;
            }

            // --- Tool use: execute tools and loop ---
            const toolUseBlocks = contentBlocks.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
            );

            if (toolUseBlocks.length === 0) break;

            // Build the assistant message with all content blocks for the API
            const assistantContent: ContentBlockParam[] = contentBlocks.map((block) => {
              if (block.type === 'text') {
                return { type: 'text' as const, text: block.text };
              }
              return {
                type: 'tool_use' as const,
                id: (block as Anthropic.ToolUseBlock).id,
                name: (block as Anthropic.ToolUseBlock).name,
                input: (block as Anthropic.ToolUseBlock).input,
              };
            });

            apiMessages.push({ role: 'assistant', content: assistantContent });

            // Execute each tool and collect results
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolBlock of toolUseBlocks) {
              const toolName = toolBlock.name;
              const toolInput = toolBlock.input as Record<string, unknown>;

              send({
                type: 'tool_start',
                tool: toolName,
                tool_call_id: toolBlock.id,
                input: toolInput,
              });

              let result = '';
              let isError = false;

              try {
                result = await executeToolCall(
                  toolName,
                  toolInput,
                  octokit,
                  parsed,
                  project,
                  repoTreeCache,
                  async (tree) => { repoTreeCache = tree; },
                  send
                );
              } catch (err) {
                result = `Tool error: ${err instanceof Error ? err.message : String(err)}`;
                isError = true;
              }

              send({
                type: 'tool_result',
                tool: toolName,
                tool_call_id: toolBlock.id,
                result: result.length > 500 ? result.substring(0, 500) + '...' : result,
                is_error: isError,
              });

              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolBlock.id,
                content: result,
                is_error: isError,
              });
            }

            // Add tool results to messages for next iteration
            apiMessages.push({ role: 'user', content: toolResults });

            // Reset text accumulator for next iteration
            currentTextBlock = '';
          }

          // Save the full assistant response to DB
          if (convId && fullAssistantText.trim()) {
            await supabase.from('messages').insert([{
              conversation_id: convId,
              role: 'assistant',
              content: fullAssistantText,
            }]);
          }

          send({ type: 'done', conversation_id: convId });
        } catch (error) {
          send({
            type: 'error',
            message: error instanceof Error ? error.message : 'Stream error',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// --- Tool execution ---

async function executeToolCall(
  toolName: string,
  input: Record<string, unknown>,
  octokit: ReturnType<typeof createGitHubClient> | null,
  parsed: { owner: string; repo: string } | null,
  project: Record<string, unknown>,
  repoTreeCache: { path: string; type: string }[] | null,
  setTreeCache: (tree: { path: string; type: string }[]) => Promise<void>,
  send: (data: Record<string, unknown>) => void
): Promise<string> {
  if (!octokit || !parsed) {
    return 'GitHub connection not available. Please connect your GitHub account in Settings.';
  }

  switch (toolName) {
    case 'read_file': {
      const filePath = input.file_path as string;
      const content = await getFileContent(
        octokit,
        parsed.owner,
        parsed.repo,
        filePath,
        project.github_default_branch as string
      );
      if (!content) return `File not found: ${filePath}`;
      // Truncate very large files
      if (content.length > 50000) {
        return content.substring(0, 50000) + '\n\n[File truncated — showing first 50,000 characters]';
      }
      return content;
    }

    case 'list_files': {
      const directory = (input.directory as string) || '';
      // Fetch tree if not cached
      if (!repoTreeCache) {
        const tree = await getRepoTree(octokit, parsed.owner, parsed.repo);
        const entries = tree.files.map((f) => ({ path: f.path, type: f.type }));
        await setTreeCache(entries);
        repoTreeCache = entries;
      }
      // Filter by directory prefix
      const prefix = directory ? directory.replace(/\/$/, '') + '/' : '';
      const entries = repoTreeCache
        .filter((f) => {
          if (!prefix) {
            // Root: only show top-level entries
            return !f.path.includes('/');
          }
          return f.path.startsWith(prefix);
        })
        .map((f) => {
          const relative = prefix ? f.path.slice(prefix.length) : f.path;
          // Only show direct children (not deeply nested)
          if (relative.includes('/')) {
            const dir = relative.split('/')[0];
            return `${dir}/`;
          }
          return `${relative}${f.type === 'dir' ? '/' : ''}`;
        });
      // Deduplicate directories
      const unique = Array.from(new Set(entries)).sort();
      if (unique.length === 0) return `No files found in ${directory || 'root'}`;
      return unique.join('\n');
    }

    case 'search_code': {
      const query = input.query as string;
      try {
        const { data } = await octokit.search.code({
          q: `${query} repo:${parsed.owner}/${parsed.repo}`,
          per_page: 10,
        });
        if (data.items.length === 0) return `No results for "${query}"`;
        return data.items
          .map((item) => `${item.path} (${item.html_url})`)
          .join('\n');
      } catch {
        // Fallback: search through cached tree by filename
        if (!repoTreeCache) {
          const tree = await getRepoTree(octokit, parsed.owner, parsed.repo);
          const entries = tree.files.map((f) => ({ path: f.path, type: f.type }));
          await setTreeCache(entries);
          repoTreeCache = entries;
        }
        const matches = repoTreeCache
          .filter((f) => f.type === 'file' && f.path.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 20);
        if (matches.length === 0) return `No files matching "${query}"`;
        return matches.map((f) => f.path).join('\n');
      }
    }

    case 'suggest_fix': {
      const filePath = input.file_path as string;
      const content = input.content as string;
      const description = input.description as string;

      // Send structured suggestion to the client for rendering
      send({
        type: 'code_suggestion',
        file_path: filePath,
        content,
        description,
        language: detectLanguage(filePath),
      });

      return `Fix suggestion displayed to user for ${filePath}: ${description}`;
    }

    case 'apply_fix': {
      const filePath = input.file_path as string;
      const content = input.content as string;
      const commitMessage = (input.commit_message as string) || `fix: update ${filePath}`;
      const shouldCreatePR = input.create_pr !== false;
      const prTitle = (input.pr_title as string) || commitMessage;

      const branchName = `shipready/fix-${Date.now()}`;
      const baseBranch = (project.github_default_branch as string) || 'main';

      // Create branch
      await createBranch(octokit, parsed.owner, parsed.repo, branchName, baseBranch);

      // Commit the file
      await createOrUpdateFile(
        octokit,
        parsed.owner,
        parsed.repo,
        filePath,
        content,
        commitMessage,
        branchName
      );

      let prUrl: string | undefined;
      if (shouldCreatePR) {
        const pr = await createPullRequest(
          octokit,
          parsed.owner,
          parsed.repo,
          prTitle,
          `Applied by ShipReady AI assistant.\n\n${input.description || ''}`,
          branchName,
          baseBranch
        );
        prUrl = pr.html_url;
      }

      send({
        type: 'applied_fix',
        file_path: filePath,
        branch: branchName,
        pr_url: prUrl,
      });

      return prUrl
        ? `Fix applied! Branch: ${branchName}, PR: ${prUrl}`
        : `Fix committed to branch: ${branchName}`;
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
    yml: 'yaml', yaml: 'yaml', json: 'json', md: 'markdown',
    css: 'css', scss: 'scss', html: 'html', sql: 'sql',
    sh: 'bash', bash: 'bash', zsh: 'bash',
    dockerfile: 'dockerfile',
  };
  return map[ext] || 'text';
}
