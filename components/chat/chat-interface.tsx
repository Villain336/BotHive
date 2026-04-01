'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { Badge } from '@/components/ui/badge';
import { TestTube2, Lock, Scale, Server, MessageSquare } from 'lucide-react';
import type { ScanCategory } from '@/lib/types';

// Structured block types for rich message rendering
export interface ChatBlock {
  id: string;
  type: 'text' | 'tool_start' | 'tool_result' | 'code_suggestion' | 'applied_fix';
  content: string;
  metadata?: {
    tool?: string;
    tool_call_id?: string;
    input?: Record<string, unknown>;
    result?: string;
    is_error?: boolean;
    file_path?: string;
    language?: string;
    description?: string;
    branch?: string;
    pr_url?: string;
    status?: 'running' | 'done' | 'error';
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  blocks: ChatBlock[];
}

interface ChatInterfaceProps {
  projectId: string;
  category?: ScanCategory | 'general';
  conversationId?: string;
  initialMessage?: string;
}

const categoryInfo = {
  testing: { icon: TestTube2, label: 'Testing Expert', color: 'text-blue-500' },
  security: { icon: Lock, label: 'Security Expert', color: 'text-red-500' },
  legal: { icon: Scale, label: 'Legal Expert', color: 'text-green-500' },
  ops: { icon: Server, label: 'Ops Expert', color: 'text-purple-500' },
  general: { icon: MessageSquare, label: 'General Assistant', color: 'text-gray-500' },
};

export function ChatInterface({
  projectId,
  category = 'general',
  conversationId: initialConvId,
  initialMessage,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConvId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  // Helper to update blocks in the current assistant message
  function updateAssistantBlocks(
    updater: (blocks: ChatBlock[]) => ChatBlock[]
  ) {
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.role === 'assistant') {
        last.blocks = updater([...last.blocks]);
      }
      return [...updated];
    });
  }

  async function sendMessage(content: string) {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      blocks: [{ id: crypto.randomUUID(), type: 'text', content }],
    };

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      blocks: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    // Track the current text block ID so deltas append to it
    let currentTextBlockId: string | null = null;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          project_id: projectId,
          conversation_id: conversationId,
          category,
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            handleSSEEvent(data);
          } catch {
            // Skip malformed SSE
          }
        }
      }
    } catch {
      updateAssistantBlocks((blocks) => [
        ...blocks,
        {
          id: crypto.randomUUID(),
          type: 'text',
          content: 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
      currentTextBlockId = null;
    }

    function handleSSEEvent(data: Record<string, unknown>) {
      switch (data.type) {
        case 'text_delta': {
          const text = data.content as string;
          if (!currentTextBlockId) {
            currentTextBlockId = crypto.randomUUID();
            updateAssistantBlocks((blocks) => [
              ...blocks,
              { id: currentTextBlockId!, type: 'text', content: text },
            ]);
          } else {
            const blockId = currentTextBlockId;
            updateAssistantBlocks((blocks) =>
              blocks.map((b) =>
                b.id === blockId ? { ...b, content: b.content + text } : b
              )
            );
          }
          break;
        }

        case 'tool_start': {
          // A tool call starts — stop appending to current text block
          currentTextBlockId = null;
          const blockId = crypto.randomUUID();
          updateAssistantBlocks((blocks) => [
            ...blocks,
            {
              id: blockId,
              type: 'tool_start',
              content: '',
              metadata: {
                tool: data.tool as string,
                tool_call_id: data.tool_call_id as string,
                input: data.input as Record<string, unknown>,
                status: 'running',
              },
            },
          ]);
          break;
        }

        case 'tool_result': {
          const toolCallId = data.tool_call_id as string;
          updateAssistantBlocks((blocks) =>
            blocks.map((b) =>
              b.metadata?.tool_call_id === toolCallId
                ? {
                    ...b,
                    type: 'tool_result' as const,
                    metadata: {
                      ...b.metadata,
                      result: data.result as string,
                      is_error: data.is_error as boolean,
                      status: (data.is_error ? 'error' : 'done') as 'error' | 'done',
                    },
                  }
                : b
            )
          );
          break;
        }

        case 'code_suggestion': {
          currentTextBlockId = null;
          updateAssistantBlocks((blocks) => [
            ...blocks,
            {
              id: crypto.randomUUID(),
              type: 'code_suggestion',
              content: data.content as string,
              metadata: {
                file_path: data.file_path as string,
                language: data.language as string,
                description: data.description as string,
              },
            },
          ]);
          break;
        }

        case 'applied_fix': {
          currentTextBlockId = null;
          updateAssistantBlocks((blocks) => [
            ...blocks,
            {
              id: crypto.randomUUID(),
              type: 'applied_fix',
              content: '',
              metadata: {
                file_path: data.file_path as string,
                branch: data.branch as string,
                pr_url: data.pr_url as string | undefined,
              },
            },
          ]);
          break;
        }

        case 'done': {
          if (data.conversation_id) {
            setConversationId(data.conversation_id as string);
          }
          break;
        }

        case 'error': {
          updateAssistantBlocks((blocks) => [
            ...blocks,
            {
              id: crypto.randomUUID(),
              type: 'text',
              content: `Error: ${data.message}`,
            },
          ]);
          break;
        }
      }
    }
  }

  const info = categoryInfo[category];
  const Icon = info.icon;

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center gap-2 pb-4 border-b mb-4">
        <Icon className={`h-5 w-5 ${info.color}`} />
        <h2 className="font-semibold">{info.label}</h2>
        <Badge variant="outline" className="capitalize">{category}</Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Icon className={`h-12 w-12 ${info.color} mb-4 opacity-50`} />
            <h3 className="text-lg font-medium mb-2">Chat with {info.label}</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              I can read your code, find issues, generate fixes, and apply them directly via PR.
              Ask me anything about making your project production-ready.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            blocks={msg.blocks}
            projectId={projectId}
            isStreaming={
              isLoading &&
              msg.role === 'assistant' &&
              msg === messages[messages.length - 1]
            }
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t mt-4">
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
