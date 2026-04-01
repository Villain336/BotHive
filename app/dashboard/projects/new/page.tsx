'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Github, Loader2, FolderGit2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    // Validate GitHub URL format
    const githubRegex = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;
    if (!githubRegex.test(repoUrl.trim())) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_repo_url: repoUrl.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to connect repository');
      }

      const { data } = await response.json();
      router.push(`/dashboard/projects/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect repository');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5" />
            Connect a GitHub Repository
          </CardTitle>
          <CardDescription>
            Paste your GitHub repo URL to scan it for compliance gaps and get your production-readiness score.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {user?.github_username ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Github className="h-4 w-4" />
              Connected as @{user.github_username}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Repository URL</label>
            <Input
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Github className="h-4 w-4" />
                Connect & Scan
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
