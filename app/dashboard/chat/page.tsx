'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  TestTube2,
  Lock,
  Scale,
  Server,
  Loader2,
  Plus,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import type { Conversation } from '@/lib/types';

const categoryConfig = {
  testing: { icon: TestTube2, color: 'text-blue-500', label: 'Testing' },
  security: { icon: Lock, color: 'text-red-500', label: 'Security' },
  legal: { icon: Scale, color: 'text-green-500', label: 'Legal' },
  ops: { icon: Server, color: 'text-purple-500', label: 'Ops' },
  general: { icon: MessageSquare, color: 'text-gray-500', label: 'General' },
} as const;

export default function ChatHistoryPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/conversations');
        if (res.ok) {
          const { data } = await res.json();
          setConversations(data || []);
        }
      } catch (e) {
        console.error('Failed to load conversations', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Chat History</h1>
          <p className="text-muted-foreground mt-1">
            {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
          </p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Start a chat from any project to get AI-powered help with compliance, testing, security, and more.
            </p>
            <Link href="/dashboard/projects">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Go to Projects
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const cat = categoryConfig[conv.category as keyof typeof categoryConfig] || categoryConfig.general;
            const CatIcon = cat.icon;

            return (
              <Card
                key={conv.id}
                className="hover:border-primary transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/projects/${conv.project_id}/chat?conversation=${conv.id}`)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`rounded-lg bg-muted p-2`}>
                    <CatIcon className={`h-5 w-5 ${cat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {conv.title || 'Untitled conversation'}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize shrink-0">
                        {cat.label}
                      </Badge>
                      {conv.status === 'resolved' && (
                        <Badge variant="secondary" className="text-xs shrink-0">Resolved</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(conv.updated_at).toLocaleDateString()} at{' '}
                      {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
