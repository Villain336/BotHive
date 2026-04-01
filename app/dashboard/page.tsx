'use client';

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
import {
  FolderGit2,
  Plus,
  TestTube2,
  Lock,
  Scale,
  Server,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const categoryIcons = {
  testing: TestTube2,
  security: Lock,
  legal: Scale,
  ops: Server,
};

const categoryColors = {
  testing: 'text-blue-500',
  security: 'text-red-500',
  legal: 'text-green-500',
  ops: 'text-purple-500',
};

export default function DashboardPage() {
  const { user } = useAuth();

  // Placeholder for when projects are loaded from API
  const projects: Array<{
    id: string;
    github_repo_name: string;
    overall_score?: number;
    test_score?: number;
    security_score?: number;
    legal_score?: number;
    ops_score?: number;
    status: string;
    last_scan_at?: string;
  }> = [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back{user?.full_name ? `, ${user.full_name}` : ''}
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
              Connect your first GitHub repository to get a compliance score and start fixing gaps with AI.
            </p>
            <Link href="/dashboard/projects/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Connect Your First Repo
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.github_repo_name}</CardTitle>
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
                  {project.overall_score !== undefined && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Score</span>
                        <span className="text-2xl font-bold">{project.overall_score}/100</span>
                      </div>
                      <Progress value={project.overall_score} />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {(['testing', 'security', 'legal', 'ops'] as const).map((cat) => {
                          const Icon = categoryIcons[cat];
                          const score = project[`${cat}_score` as keyof typeof project] as number | undefined;
                          return (
                            <div key={cat} className="flex items-center gap-1.5">
                              <Icon className={`h-3.5 w-3.5 ${categoryColors[cat]}`} />
                              <span className="capitalize">{cat}</span>
                              <span className="ml-auto font-medium">{score ?? '-'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {project.overall_score === undefined && (
                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                      Run a scan to get your compliance score
                      <ArrowRight className="h-3 w-3" />
                    </div>
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
