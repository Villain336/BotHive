'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FolderGit2, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Project } from '@/lib/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const { data } = await res.json();
          setProjects(data || []);
        }
      } catch (e) {
        console.error('Failed to load projects', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
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
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {projects.length} connected {projects.length === 1 ? 'repository' : 'repositories'}
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Connect Repo
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderGit2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Connect your first GitHub repository to get started.
            </p>
            <Link href="/dashboard/projects/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Connect Repo
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg truncate">{project.github_repo_name}</CardTitle>
                    <Badge variant={project.status === 'ready' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {project.last_scan_at
                      ? `Last scanned ${new Date(project.last_scan_at).toLocaleDateString()}`
                      : 'Not scanned yet'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {project.overall_score !== undefined ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Score</span>
                        <span className="font-bold">{project.overall_score}/100</span>
                      </div>
                      <Progress value={project.overall_score} />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Run a scan to see your score</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
