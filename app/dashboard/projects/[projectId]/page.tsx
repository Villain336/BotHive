'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  TestTube2,
  Lock,
  Scale,
  Server,
  Loader2,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import type { Project, ScanFinding } from '@/lib/types';

const categoryConfig = {
  testing: { icon: TestTube2, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Testing' },
  security: { icon: Lock, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Security' },
  legal: { icon: Scale, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Legal' },
  ops: { icon: Server, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Ops' },
} as const;

const severityConfig = {
  critical: { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: AlertTriangle },
  high: { color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', icon: AlertTriangle },
  medium: { color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Info },
  low: { color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: Info },
  info: { color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-900/30', icon: Info },
} as const;

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [findings, setFindings] = useState<ScanFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    try {
      const [projRes, findingsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/findings`),
      ]);
      if (projRes.ok) {
        const { data } = await projRes.json();
        setProject(data);
      }
      if (findingsRes.ok) {
        const { data } = await findingsRes.json();
        setFindings(data || []);
      }
    } catch (e) {
      console.error('Failed to load project', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function runScan() {
    setIsScanning(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/scan`, { method: 'POST' });
      if (res.ok) {
        await loadProject();
      }
    } catch (e) {
      console.error('Scan failed', e);
    } finally {
      setIsScanning(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Project not found</p>
        <Link href="/dashboard/projects">
          <Button variant="outline" className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const openFindings = findings.filter((f) => f.status === 'open');
  const findingsByCategory = {
    testing: openFindings.filter((f) => f.category === 'testing'),
    security: openFindings.filter((f) => f.category === 'security'),
    legal: openFindings.filter((f) => f.category === 'legal'),
    ops: openFindings.filter((f) => f.category === 'ops'),
  };

  return (
    <div>
      <Link href="/dashboard/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{project.github_repo_name}</h1>
          <p className="text-muted-foreground mt-1">
            {project.last_scan_at
              ? `Last scanned ${new Date(project.last_scan_at).toLocaleDateString()}`
              : 'Not scanned yet'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/projects/${projectId}/chat`}>
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Chat
            </Button>
          </Link>
          <Button onClick={runScan} disabled={isScanning} className="gap-2">
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isScanning ? 'Scanning...' : 'Run Scan'}
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      {project.overall_score !== undefined && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Compliance Score</h2>
              <span className="text-4xl font-bold">{project.overall_score}/100</span>
            </div>
            <Progress value={project.overall_score} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {(Object.entries(categoryConfig) as [keyof typeof categoryConfig, typeof categoryConfig[keyof typeof categoryConfig]][]).map(([key, config]) => {
          const score = project[`${key}_score` as keyof Project] as number | undefined;
          const catFindings = findingsByCategory[key];
          const Icon = config.icon;

          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg ${config.bgColor} p-1.5`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <CardTitle className="text-base">{config.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{score ?? '-'}/100</div>
                {score !== undefined && <Progress value={score} className="h-1.5 mb-2" />}
                <p className="text-xs text-muted-foreground">
                  {catFindings.length} open {catFindings.length === 1 ? 'finding' : 'findings'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Findings List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Findings ({openFindings.length})</CardTitle>
            <Link href={`/dashboard/projects/${projectId}/chat`}>
              <Button size="sm" className="gap-2">
                <MessageSquare className="h-3.5 w-3.5" />
                Fix with AI
              </Button>
            </Link>
          </div>
          <CardDescription>Issues found in your repository that need attention</CardDescription>
        </CardHeader>
        <CardContent>
          {openFindings.length === 0 ? (
            <div className="text-center py-8">
              {project.overall_score !== undefined ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-muted-foreground">No open findings. Great job!</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Run a scan to discover findings</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {openFindings.map((finding) => {
                const cat = categoryConfig[finding.category as keyof typeof categoryConfig];
                const sev = severityConfig[finding.severity as keyof typeof severityConfig];
                const CatIcon = cat.icon;
                return (
                  <div
                    key={finding.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-secondary/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/projects/${projectId}/chat?finding=${finding.id}`)}
                  >
                    <div className={`rounded p-1 ${sev.bgColor} mt-0.5`}>
                      <CatIcon className={`h-3.5 w-3.5 ${cat.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{finding.title}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {finding.severity}
                        </Badge>
                      </div>
                      {finding.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{finding.description}</p>
                      )}
                      {finding.file_path && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{finding.file_path}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
