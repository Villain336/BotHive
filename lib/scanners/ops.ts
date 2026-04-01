import type { ScanResult, ScannerFinding, RepoContext } from './types';

const CI_CONFIG_FILES = [
  '.github/workflows', '.gitlab-ci.yml', '.circleci/config.yml',
  'Jenkinsfile', '.travis.yml', 'azure-pipelines.yml',
  'bitbucket-pipelines.yml',
];

const DOCKER_FILES = ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', '.dockerignore'];

const MONITORING_PATTERNS = [
  'sentry', '@sentry', 'datadog', 'newrelic', 'bugsnag', 'logrocket',
  'rollbar', 'honeybadger', 'airbrake',
];

export function analyzeOps(ctx: RepoContext): ScanResult {
  const findings: ScannerFinding[] = [];
  let score = 100;

  const allFiles = ctx.files.filter((f) => f.type === 'file');
  const allPaths = allFiles.map((f) => f.path);

  // Check: CI/CD configuration
  const hasCI = CI_CONFIG_FILES.some((ci) =>
    allPaths.some((p) => p.startsWith(ci) || p === ci)
  );
  if (!hasCI) {
    findings.push({
      category: 'ops',
      severity: 'high',
      title: 'No CI/CD pipeline configured',
      description: 'No GitHub Actions, GitLab CI, CircleCI, or other CI/CD configuration found.',
      fix_suggestion: 'Add a .github/workflows/ci.yml with build, lint, and test steps.',
    });
    score -= 20;
  }

  // Check: Docker setup
  const hasDocker = DOCKER_FILES.some((d) =>
    allPaths.some((p) => p === d || p.endsWith('/' + d))
  );
  if (!hasDocker) {
    findings.push({
      category: 'ops',
      severity: 'medium',
      title: 'No Docker configuration',
      description: 'No Dockerfile or docker-compose found. Docker enables consistent deployment.',
      fix_suggestion: 'Add a Dockerfile for containerized deployment and a docker-compose.yml for local development.',
    });
    score -= 10;
  }

  // Check: Error monitoring
  const hasMonitoring = MONITORING_PATTERNS.some((m) =>
    Object.values(ctx.fileContents).some((c) => c.toLowerCase().includes(m))
  );
  if (!hasMonitoring) {
    findings.push({
      category: 'ops',
      severity: 'high',
      title: 'No error monitoring detected',
      description: 'No error monitoring service (Sentry, Datadog, etc.) found in the codebase.',
      fix_suggestion: 'Add Sentry or similar for production error tracking. Critical for knowing when things break.',
    });
    score -= 20;
  }

  // Check: Health check endpoint
  const hasHealthCheck = allPaths.some((p) =>
    p.includes('health') || p.includes('healthz') || p.includes('readiness')
  ) || Object.values(ctx.fileContents).some((c) =>
    c.includes('/api/health') || c.includes('/healthz')
  );
  if (!hasHealthCheck) {
    findings.push({
      category: 'ops',
      severity: 'medium',
      title: 'No health check endpoint',
      description: 'No /api/health or /healthz endpoint found. Required for container orchestration and uptime monitoring.',
      fix_suggestion: 'Add a GET /api/health endpoint that returns 200 OK with basic system status.',
    });
    score -= 10;
  }

  // Check: Environment validation
  const hasEnvValidation = Object.values(ctx.fileContents).some((c) =>
    c.includes('env.mjs') || c.includes('createEnv') ||
    (c.includes('process.env') && c.includes('throw') && c.includes('missing'))
  );
  const hasEnvExample = allPaths.some((p) =>
    p.includes('.env.example') || p.includes('.env.sample')
  );
  if (!hasEnvValidation) {
    findings.push({
      category: 'ops',
      severity: 'medium',
      title: 'No environment variable validation',
      description: 'No startup validation for required environment variables detected.',
      fix_suggestion: 'Add env validation at startup (e.g., using zod or @t3-oss/env-nextjs) to fail fast on misconfiguration.',
    });
    score -= 10;
  }
  if (!hasEnvExample) {
    findings.push({
      category: 'ops',
      severity: 'low',
      title: 'No .env.example file',
      description: 'No .env.example or .env.sample file to document required environment variables.',
      fix_suggestion: 'Create a .env.example with all required env vars (without real values) for developer onboarding.',
    });
    score -= 5;
  }

  // Check: Logging setup
  const hasLogging = Object.values(ctx.fileContents).some((c) =>
    c.includes('winston') || c.includes('pino') || c.includes('bunyan') ||
    c.includes('logger') || c.includes('logging')
  );
  if (!hasLogging) {
    findings.push({
      category: 'ops',
      severity: 'low',
      title: 'No structured logging',
      description: 'No structured logging library (winston, pino) detected. console.log is not sufficient for production.',
      fix_suggestion: 'Add a structured logging library like pino for production-grade log management.',
    });
    score -= 5;
  }

  // Check: README exists
  const hasReadme = allPaths.some((p) =>
    p.toLowerCase() === 'readme.md' || p.toLowerCase() === 'readme'
  );
  if (!hasReadme) {
    findings.push({
      category: 'ops',
      severity: 'low',
      title: 'No README file',
      description: 'No README.md found. A README is essential for project documentation.',
      fix_suggestion: 'Add a README.md with project description, setup instructions, and development guide.',
    });
    score -= 5;
  }

  // Deep check: CI pipeline completeness
  const ciWorkflowEntries = Object.entries(ctx.fileContents).filter(([path]) =>
    /\.github\/workflows\/.*\.ya?ml$/.test(path)
  );
  if (ciWorkflowEntries.length > 0) {
    // Combine all workflow contents to check for steps across all workflows
    const combinedCI = ciWorkflowEntries.map(([, content]) => content).join('\n').toLowerCase();
    const ciSteps: { name: string; patterns: RegExp[]; severity: 'low' | 'medium' }[] = [
      { name: 'checkout', patterns: [/actions\/checkout/], severity: 'low' },
      { name: 'install', patterns: [/npm ci\b/, /npm install\b/, /yarn install\b/, /pnpm install\b/], severity: 'medium' },
      { name: 'lint', patterns: [/\blint\b/, /eslint/], severity: 'low' },
      { name: 'test', patterns: [/\btest\b/, /jest/, /vitest/, /pytest/], severity: 'medium' },
      { name: 'build', patterns: [/\bbuild\b/, /next build/, /tsc/], severity: 'medium' },
    ];
    for (const step of ciSteps) {
      const found = step.patterns.some((p) => p.test(combinedCI));
      if (!found) {
        findings.push({
          category: 'ops',
          severity: step.severity,
          title: `CI pipeline missing "${step.name}" step`,
          description: `No "${step.name}" step detected in your GitHub Actions workflows.`,
          fix_suggestion: `Add a "${step.name}" step to your CI pipeline to ensure code quality.`,
        });
        score -= step.severity === 'medium' ? 5 : 3;
      }
    }
  }

  // Deep check: Dockerfile best practices
  const dockerfileContent = ctx.fileContents['Dockerfile'] || '';
  if (dockerfileContent) {
    // Check for multi-stage build
    const fromStatements = (dockerfileContent.match(/^FROM\s+/gmi) || []).length;
    if (fromStatements < 2) {
      findings.push({
        category: 'ops',
        severity: 'low',
        title: 'Dockerfile not using multi-stage build',
        description: 'Dockerfile has a single FROM stage. Multi-stage builds reduce image size by separating build and runtime.',
        file_path: 'Dockerfile',
        fix_suggestion: 'Use a multi-stage Dockerfile: one stage for building and one for the runtime image to reduce final image size.',
      });
      score -= 3;
    }

    // Check for non-root USER directive
    if (!/^USER\s+/mi.test(dockerfileContent)) {
      findings.push({
        category: 'ops',
        severity: 'medium',
        title: 'Dockerfile runs as root',
        description: 'No USER directive found in Dockerfile. Running containers as root is a security risk.',
        file_path: 'Dockerfile',
        fix_suggestion: 'Add a USER directive (e.g., USER node or USER 1001) to run the container as a non-root user.',
      });
      score -= 5;
    }

    // Check for .dockerignore
    const hasDockerignore = allPaths.some((p) => p === '.dockerignore');
    if (!hasDockerignore) {
      findings.push({
        category: 'ops',
        severity: 'low',
        title: 'No .dockerignore file',
        description: 'No .dockerignore file found. Without it, unnecessary files (node_modules, .git) are copied into the Docker context.',
        fix_suggestion: 'Create a .dockerignore file to exclude node_modules, .git, .env, and other unnecessary files from the Docker build context.',
      });
      score -= 3;
    }
  }

  return {
    category: 'ops',
    score: Math.max(0, score),
    findings,
  };
}
