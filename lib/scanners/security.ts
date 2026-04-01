import type { ScanResult, ScannerFinding, RepoContext } from './types';

const SECRET_PATTERNS = [
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]\S{10,}['"]/gi, name: 'API Key' },
  { pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"]\S{6,}['"]/gi, name: 'Secret/Password' },
  { pattern: /(?:AWS|aws)(?:_ACCESS_KEY_ID|_SECRET_ACCESS_KEY)\s*[:=]\s*['"]\S+['"]/g, name: 'AWS Credential' },
  { pattern: /sk[-_](?:live|test)[-_]\S{20,}/g, name: 'Stripe Secret Key' },
  { pattern: /ghp_[A-Za-z0-9_]{36,}/g, name: 'GitHub Token' },
  { pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g, name: 'Private Key' },
];

export function analyzeSecurity(ctx: RepoContext): ScanResult {
  const findings: ScannerFinding[] = [];
  let score = 100;

  const allFiles = ctx.files.filter((f) => f.type === 'file');

  // Check: .env file committed
  const envFiles = allFiles.filter((f) =>
    /^\.env(?:\.\w+)?$/.test(f.path.split('/').pop() || '') &&
    !f.path.includes('.example') &&
    !f.path.includes('.sample')
  );
  if (envFiles.length > 0) {
    findings.push({
      category: 'security',
      severity: 'critical',
      title: '.env file found in repository',
      description: `Found ${envFiles.length} .env file(s) that may contain secrets: ${envFiles.map((f) => f.path).join(', ')}`,
      file_path: envFiles[0].path,
      fix_suggestion: 'Add .env to .gitignore and remove it from version control. Use .env.example for templates.',
    });
    score -= 25;
  }

  // Check: .gitignore exists and covers .env
  const gitignore = ctx.fileContents['.gitignore'] || '';
  if (!gitignore) {
    findings.push({
      category: 'security',
      severity: 'high',
      title: 'No .gitignore file',
      description: 'No .gitignore file found. Secrets and build artifacts may be committed.',
      fix_suggestion: 'Add a .gitignore file with entries for .env, node_modules, dist, etc.',
    });
    score -= 15;
  } else if (!gitignore.includes('.env')) {
    findings.push({
      category: 'security',
      severity: 'high',
      title: '.env not in .gitignore',
      description: '.gitignore exists but does not include .env files.',
      file_path: '.gitignore',
      fix_suggestion: 'Add ".env*" (or ".env.local") to .gitignore to prevent accidental secret commits.',
    });
    score -= 15;
  }

  // Check: Secrets in source code
  for (const [path, content] of Object.entries(ctx.fileContents)) {
    if (path.includes('node_modules') || path.includes('.example') || path === '.gitignore') continue;

    for (const { pattern, name } of SECRET_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        findings.push({
          category: 'security',
          severity: 'critical',
          title: `Potential ${name} found in source code`,
          description: `A hardcoded ${name.toLowerCase()} was detected in ${path}.`,
          file_path: path,
          fix_suggestion: 'Move secrets to environment variables and never commit them to source control.',
        });
        score -= 20;
        break;
      }
    }
  }

  // Check: Security headers (Next.js)
  const nextConfig = ctx.fileContents['next.config.js'] || ctx.fileContents['next.config.mjs'] || ctx.fileContents['next.config.ts'] || '';
  if (nextConfig && !nextConfig.includes('headers')) {
    findings.push({
      category: 'security',
      severity: 'medium',
      title: 'No security headers configured',
      description: 'next.config.js does not configure security headers (CSP, X-Frame-Options, etc.).',
      file_path: 'next.config.js',
      fix_suggestion: 'Add security headers in next.config.js: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options.',
    });
    score -= 10;
  }

  // Check: Rate limiting
  const hasRateLimit = allFiles.some((f) =>
    f.path.includes('rate-limit') || f.path.includes('rateLimit') || f.path.includes('throttle')
  ) || Object.values(ctx.fileContents).some((c) =>
    c.includes('rate-limit') || c.includes('rateLimit') || c.includes('upstash')
  );
  if (!hasRateLimit) {
    findings.push({
      category: 'security',
      severity: 'medium',
      title: 'No rate limiting detected',
      description: 'No rate limiting configuration found for API routes.',
      fix_suggestion: 'Add rate limiting to your API routes using Upstash Redis or a similar solution.',
    });
    score -= 10;
  }

  // Check: Dependency vulnerabilities hint
  const packageJson = ctx.packageJson;
  if (packageJson) {
    const deps = {
      ...(packageJson.dependencies as Record<string, string> || {}),
      ...(packageJson.devDependencies as Record<string, string> || {}),
    };

    if (!deps['eslint-plugin-security'] && !deps['@typescript-eslint/eslint-plugin']) {
      findings.push({
        category: 'security',
        severity: 'low',
        title: 'No security linting plugin',
        description: 'No security-focused ESLint plugin found in dependencies.',
        fix_suggestion: 'Add eslint-plugin-security to catch common security issues in your code.',
      });
      score -= 5;
    }
  }

  // Check: HTTPS enforcement
  const hasMiddleware = allFiles.some((f) => f.path === 'middleware.ts' || f.path === 'middleware.js');
  if (!hasMiddleware) {
    findings.push({
      category: 'security',
      severity: 'low',
      title: 'No middleware.ts for security enforcement',
      description: 'No Next.js middleware found. Middleware can enforce HTTPS, auth, and other security policies.',
      fix_suggestion: 'Add a middleware.ts to enforce authentication on protected routes.',
    });
    score -= 5;
  }

  // Deep check: Input validation in API routes
  for (const [path, content] of Object.entries(ctx.fileContents)) {
    if (!path.includes('app/api/') || !/route\.[jt]sx?$/.test(path)) continue;
    const hasValidation = /import\s+.*(?:zod|joi|yup|z\s+from\s+['"]zod|Joi\s+from\s+['"]joi|yup\s+from\s+['"]yup)/i.test(content) ||
      /from\s+['"](?:zod|joi|yup)['"]/i.test(content);
    if (!hasValidation) {
      findings.push({
        category: 'security',
        severity: 'high',
        title: 'API route missing input validation',
        description: `${path} does not import a validation library (zod, joi, or yup). Unvalidated input can lead to injection attacks.`,
        file_path: path,
        fix_suggestion: 'Add input validation using zod, joi, or yup to validate request body and query parameters.',
      });
      score -= 10;
    }
  }

  // Deep check: Auth middleware check
  const middlewareContent = ctx.fileContents['middleware.ts'] || ctx.fileContents['middleware.js'] || '';
  if (middlewareContent) {
    const authPatterns = /getSession|getUser|getToken|auth\(|withAuth|getAuth|session|token|verify|authenticated/i;
    if (!authPatterns.test(middlewareContent)) {
      findings.push({
        category: 'security',
        severity: 'high',
        title: 'Middleware missing auth checks',
        description: 'middleware.ts exists but does not appear to include authentication or session verification logic.',
        file_path: 'middleware.ts',
        fix_suggestion: 'Add auth/session checking to middleware.ts to protect routes (e.g., getSession, getToken, auth()).',
      });
      score -= 10;
    }
  }

  // Deep check: Error exposure in API routes
  for (const [path, content] of Object.entries(ctx.fileContents)) {
    if (!path.includes('app/api/') || !/route\.[jt]sx?$/.test(path)) continue;
    const exposesErrorStack = /error\.stack/.test(content);
    const exposesErrorMessage = /(?:json|Response)\s*\(.*error\.message/.test(content) ||
      /message:\s*(?:error|err|e)\.message/.test(content);
    if (exposesErrorStack || exposesErrorMessage) {
      findings.push({
        category: 'security',
        severity: 'medium',
        title: 'Error details exposed in API response',
        description: `${path} may expose raw error details (${exposesErrorStack ? 'error.stack' : 'error.message'}) in responses, leaking internal information.`,
        file_path: path,
        fix_suggestion: 'Sanitize error responses. Return generic error messages to clients and log detailed errors server-side.',
      });
      score -= 5;
    }
  }

  return {
    category: 'security',
    score: Math.max(0, score),
    findings,
  };
}
