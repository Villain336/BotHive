'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolStatus } from './tool-status';
import { CodeSuggestion } from './code-suggestion';
import { Check, ExternalLink, GitBranch } from 'lucide-react';
import type { ChatBlock } from './chat-interface';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  blocks: ChatBlock[];
  projectId: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, blocks, projectId, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  // User messages: just render the text content
  if (isUser) {
    const text = blocks.map((b) => b.content).join('');
    return (
      <div className="flex gap-3 py-4 justify-end">
        <div className="max-w-[80%] rounded-lg px-4 py-3 bg-primary text-primary-foreground">
          <p className="text-sm whitespace-pre-wrap">{text}</p>
        </div>
        <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
    );
  }

  // Assistant messages: render each block with appropriate component
  return (
    <div className="flex gap-3 py-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="max-w-[85%] min-w-0">
        {blocks.map((block, i) => {
          const isLastBlock = i === blocks.length - 1;

          switch (block.type) {
            case 'text':
              if (!block.content && isStreaming && isLastBlock) {
                return (
                  <span key={block.id} className="inline-block w-2 h-4 bg-primary animate-pulse" />
                );
              }
              if (!block.content) return null;
              return (
                <div key={block.id} className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {block.content}
                  </ReactMarkdown>
                  {isStreaming && isLastBlock && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  )}
                </div>
              );

            case 'tool_start':
            case 'tool_result':
              return (
                <ToolStatus
                  key={block.id}
                  tool={block.metadata?.tool || 'unknown'}
                  input={block.metadata?.input}
                  result={block.metadata?.result}
                  isError={block.metadata?.is_error}
                  status={block.metadata?.status || 'running'}
                />
              );

            case 'code_suggestion':
              return (
                <CodeSuggestion
                  key={block.id}
                  filePath={block.metadata?.file_path || 'unknown'}
                  content={block.content}
                  description={block.metadata?.description || ''}
                  language={block.metadata?.language}
                  projectId={projectId}
                />
              );

            case 'applied_fix':
              return (
                <div
                  key={block.id}
                  className="my-2 rounded-md border bg-green-500/10 px-3 py-2 flex items-center gap-2 text-sm"
                >
                  <Check className="h-4 w-4 text-green-500" />
                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    Fix applied to{' '}
                    <code className="font-mono text-xs">{block.metadata?.file_path}</code>
                    {' on branch '}
                    <code className="font-mono text-xs">{block.metadata?.branch}</code>
                  </span>
                  {block.metadata?.pr_url && (
                    <a
                      href={block.metadata.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline ml-auto"
                    >
                      View PR <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              );

            default:
              return null;
          }
        })}

        {/* Show cursor when streaming and no blocks yet */}
        {isStreaming && blocks.length === 0 && (
          <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
        )}
      </div>
    </div>
  );
}
