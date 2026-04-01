import { buildSystemPrompt } from '@/lib/ai/system-prompts';
import type { Project, ScanFinding } from '@/lib/types';

const mockProject: Project = {
  id: 'proj-1',
  user_id: 'user-1',
  github_repo_url: 'https://github.com/acme/webapp',
  github_repo_name: 'acme/webapp',
  github_default_branch: 'main',
  overall_score: 72,
  test_score: 60,
  security_score: 80,
  legal_score: 70,
  ops_score: 78,
  status: 'ready',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const mockFindings: ScanFinding[] = [
  {
    id: 'f-1',
    project_id: 'proj-1',
    scan_id: 'scan-1',
    category: 'security',
    severity: 'high',
    title: 'Missing CSRF protection',
    description: 'No CSRF tokens found',
    status: 'open',
    file_path: 'src/api/auth.ts',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

describe('buildSystemPrompt', () => {
  it('returns a string containing ShipReady AI', () => {
    const result = buildSystemPrompt('general', mockProject);
    expect(result).toContain('ShipReady AI');
  });

  it('includes Testing Expert for testing category', () => {
    const result = buildSystemPrompt('testing', mockProject);
    expect(result).toContain('Testing Expert');
  });

  it('includes OWASP for security category', () => {
    const result = buildSystemPrompt('security', mockProject);
    expect(result).toContain('OWASP');
  });

  it('includes generalist for general category', () => {
    const result = buildSystemPrompt('general', mockProject);
    expect(result).toContain('generalist');
  });

  it('includes the project repo name in output', () => {
    const result = buildSystemPrompt('general', mockProject);
    expect(result).toContain('acme/webapp');
  });

  it('includes findings titles when provided', () => {
    const result = buildSystemPrompt('security', mockProject, mockFindings);
    expect(result).toContain('Missing CSRF protection');
  });

  it('includes scores when project has them', () => {
    const result = buildSystemPrompt('general', mockProject);
    expect(result).toContain('72/100');
    expect(result).toContain('60/100');
    expect(result).toContain('80/100');
  });
});
