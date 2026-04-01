'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Copy, GitBranch, Loader2, ExternalLink } from 'lucide-react';

interface CodeSuggestionProps {
  filePath: string;
  content: string;
  description: string;
  language?: string;
  projectId: string;
  onApplied?: (result: { branch: string; pr_url?: string }) => void;
}

export function CodeSuggestion({
  filePath,
  content,
  description,
  language,
  projectId,
  onApplied,
}: CodeSuggestionProps) {
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<{ branch: string; pr_url?: string } | null>(null);
  const [error, setError] = useState('');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    setApplying(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: filePath,
          content,
          commit_message: `fix: ${description}`,
          create_pr: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to apply fix');
      }
      const result = await res.json();
      setApplied(result.data);
      onApplied?.(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="my-3 rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <code className="text-xs font-mono text-primary truncate">{filePath}</code>
          {language && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
              {language}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
          {!applied && (
            <Button
              variant="default"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleApply}
              disabled={applying}
            >
              {applying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <GitBranch className="h-3 w-3" />
              )}
              <span className="ml-1">{applying ? 'Applying...' : 'Apply Fix'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="px-3 py-1.5 text-xs text-muted-foreground border-b bg-muted/20">
          {description}
        </div>
      )}

      {/* Code */}
      <div className="max-h-[400px] overflow-auto">
        <pre className="p-3 text-xs leading-relaxed">
          <code className={language ? `language-${language}` : ''}>
            {content}
          </code>
        </pre>
      </div>

      {/* Applied success */}
      {applied && (
        <div className="px-3 py-2 border-t bg-green-500/10 flex items-center gap-2 text-xs">
          <Check className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-700 dark:text-green-400">
            Applied to branch <code className="font-mono">{applied.branch}</code>
          </span>
          {applied.pr_url && (
            <a
              href={applied.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline ml-auto"
            >
              View PR <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-3 py-2 border-t bg-destructive/10 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
