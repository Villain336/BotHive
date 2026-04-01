'use client';

import { cn } from '@/lib/utils';
import { Loader2, FileCode, Search, GitBranch, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ToolStatusProps {
  tool: string;
  input?: Record<string, unknown>;
  result?: string;
  isError?: boolean;
  status: 'running' | 'done' | 'error';
}

const toolConfig: Record<string, { icon: typeof FileCode; label: string; verb: string }> = {
  read_file: { icon: FileCode, label: 'Read File', verb: 'Reading' },
  list_files: { icon: FileCode, label: 'List Files', verb: 'Listing' },
  search_code: { icon: Search, label: 'Search Code', verb: 'Searching' },
  suggest_fix: { icon: FileCode, label: 'Suggest Fix', verb: 'Preparing suggestion' },
  apply_fix: { icon: GitBranch, label: 'Apply Fix', verb: 'Applying' },
};

export function ToolStatus({ tool, input, result, isError, status }: ToolStatusProps) {
  const [expanded, setExpanded] = useState(false);
  const config = toolConfig[tool] || { icon: FileCode, label: tool, verb: 'Running' };
  const Icon = config.icon;

  const inputSummary = input
    ? (input.file_path as string) || (input.query as string) || (input.directory as string) || ''
    : '';

  return (
    <div className="my-2 rounded-md border bg-muted/30 text-sm">
      <button
        onClick={() => result && setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        {status === 'running' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
        ) : isError ? (
          <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
        ) : (
          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
        )}
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">
          {status === 'running' ? config.verb : config.label}
        </span>
        {inputSummary && (
          <code className="text-xs font-mono text-foreground truncate max-w-[300px]">
            {inputSummary}
          </code>
        )}
        {result && (
          <span className="ml-auto">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </span>
        )}
      </button>
      {expanded && result && (
        <div className="px-3 pb-2 border-t">
          <pre className="text-xs text-muted-foreground mt-2 max-h-48 overflow-auto whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
