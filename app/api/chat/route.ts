import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAnthropicClient, MODEL, MAX_TOKENS } from '@/lib/ai/client';
import { buildSystemPrompt } from '@/lib/ai/system-prompts';
import { chatTools } from '@/lib/ai/tools';
import { getFileContent, parseGitHubUrl, createGitHubClient } from '@/lib/github';
import type { ScanCategory } from '@/lib/types';

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

    // Get project
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

    // Get open findings for context
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

    // Get conversation history
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (convId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (messages) {
        conversationHistory = messages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      }
    }

    // Ensure conversation ends with the user message
    if (conversationHistory.length === 0 || conversationHistory[conversationHistory.length - 1].content !== message) {
      conversationHistory.push({ role: 'user', content: message });
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      (category as ScanCategory) || 'general',
      project,
      findings || []
    );

    // Get GitHub token for tool use
    const { data: profile } = await supabase
      .from('profiles')
      .select('github_access_token')
      .eq('id', user.id)
      .single();

    const parsed = parseGitHubUrl(project.github_repo_url);
    const octokit = profile?.github_access_token
      ? createGitHubClient(profile.github_access_token)
      : null;

    // Stream response from Claude
    const anthropic = getAnthropicClient();

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: conversationHistory,
      tools: chatTools,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullResponse = '';

        try {
          const response = await stream.finalMessage();

          for (const block of response.content) {
            if (block.type === 'text') {
              fullResponse += block.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', content: block.text })}\n\n`)
              );
            } else if (block.type === 'tool_use') {
              // Handle tool calls
              let toolResult = '';

              if (block.name === 'read_file' && octokit && parsed) {
                const input = block.input as { file_path: string };
                const content = await getFileContent(
                  octokit, parsed.owner, parsed.repo, input.file_path
                );
                toolResult = content || 'File not found';
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'tool_use',
                    tool: 'read_file',
                    file_path: input.file_path,
                  })}\n\n`)
                );
              } else if (block.name === 'suggest_fix') {
                const input = block.input as { file_path: string; content: string; description: string };
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'suggestion',
                    file_path: input.file_path,
                    content: input.content,
                    description: input.description,
                  })}\n\n`)
                );
                toolResult = 'Fix suggestion displayed to user';
              } else if (block.name === 'list_files') {
                toolResult = 'File listing provided in project context';
              }

              // Continue conversation with tool result if needed
              fullResponse += `\n[Used tool: ${block.name}]\n`;
            }
          }

          // Save assistant response
          if (convId && fullResponse) {
            await supabase.from('messages').insert([{
              conversation_id: convId,
              role: 'assistant',
              content: fullResponse,
            }]);
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'done',
              conversation_id: convId,
            })}\n\n`)
          );
        } catch (error) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              message: error instanceof Error ? error.message : 'Stream error',
            })}\n\n`)
          );
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
