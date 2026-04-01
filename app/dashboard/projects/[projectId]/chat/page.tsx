'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TestTube2, Lock, Scale, Server } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { ScanCategory } from '@/lib/types';

const categories = [
  { key: 'testing' as const, icon: TestTube2, label: 'Testing', color: 'text-blue-500' },
  { key: 'security' as const, icon: Lock, label: 'Security', color: 'text-red-500' },
  { key: 'legal' as const, icon: Scale, label: 'Legal', color: 'text-green-500' },
  { key: 'ops' as const, icon: Server, label: 'Ops', color: 'text-purple-500' },
];

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const findingId = searchParams.get('finding');

  const [selectedCategory, setSelectedCategory] = useState<ScanCategory | 'general'>('general');

  return (
    <div>
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      {/* Category selector */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={selectedCategory === 'general' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('general')}
        >
          General
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.key}
            variant={selectedCategory === cat.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.key)}
            className="gap-1.5"
          >
            <cat.icon className={`h-3.5 w-3.5 ${selectedCategory === cat.key ? '' : cat.color}`} />
            {cat.label}
          </Button>
        ))}
      </div>

      <ChatInterface
        projectId={projectId}
        category={selectedCategory}
        initialMessage={
          findingId
            ? `I have a compliance finding I need help fixing. The finding ID is ${findingId}. Can you help me understand and fix it?`
            : undefined
        }
      />
    </div>
  );
}
