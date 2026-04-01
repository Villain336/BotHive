'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestTube2, Lock, Scale, Server, MessageSquare } from 'lucide-react';
import type { ScanCategory } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  async function sendMessage(content: string) {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMsg]);

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

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

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

            if (data.type === 'text') {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  last.content += data.content;
                }
                return updated;
              });
            } else if (data.type === 'suggestion') {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  last.content += `\n\n**Suggested fix for \`${data.file_path}\`:**\n${data.description}\n\n\`\`\`\n${data.content}\n\`\`\``;
                }
                return updated;
              });
            } else if (data.type === 'done') {
              if (data.conversation_id) {
                setConversationId(data.conversation_id);
              }
            } else if (data.type === 'error') {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  last.content = `Error: ${data.message}`;
                }
                return updated;
              });
            }
          } catch {
            // Skip malformed SSE data
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant') {
          last.content = 'Sorry, something went wrong. Please try again.';
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
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
              Ask me to help fix compliance findings, generate tests, review security, or create legal documents for your project.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isStreaming={isLoading && msg.role === 'assistant' && msg === messages[messages.length - 1]}
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
