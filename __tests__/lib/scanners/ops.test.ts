import { analyzeOps } from '@/lib/scanners/ops';
import type { RepoContext } from '@/lib/scanners/types';

function makeCtx(overrides: Partial<RepoContext> = {}): RepoContext {
  return {
    files: [],
    fileContents: {},
    language: 'typescript',
    framework: 'nextjs',
    ...overrides,
  };
}

function file(path: string, size = 100): { path: string; type: 'file'; size: number } {
  return { path, type: 'file', size };
}

describe('analyzeOps', () => {
  it('returns category "ops"', () => {
    const result = analyzeOps(makeCtx());
    expect(result.category).toBe('ops');
  });

  it('flags no CI config as high with score -20', () => {
    const ctx = makeCtx({
      files: [file('src/index.ts')],
    });
    const result = analyzeOps(ctx);
    const finding = result.findings.find((f) => f.title === 'No CI/CD pipeline configured');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
  });

  it('detects GitHub Actions workflow as CI config', () => {
    const ctx = makeCtx({
      files: [file('.github/workflows/ci.yml')],
      fileContents: {
        '.github/workflows/ci.yml': 'name: CI\non: push\njobs:\n  build:\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test\n      - run: npm run build\n      - run: npm run lint',
      },
    });
    const result = analyzeOps(ctx);
    const finding = result.findings.find((f) => f.title === 'No CI/CD pipeline configured');
    expect(finding).toBeUndefined();
  });

  it('flags no Docker as medium with score -10', () => {
    const ctx = makeCtx({
      files: [file('src/index.ts')],
    });
    const result = analyzeOps(ctx);
    const finding = result.findings.find((f) => f.title === 'No Docker configuration');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
  });

  it('detects Dockerfile as Docker config', () => {
    const ctx = makeCtx({
      files: [file('Dockerfile')],
      fileContents: { 'Dockerfile': 'FROM node:20\nUSER node' },
    });
    const result = analyzeOps(ctx);
    const finding = result.findings.find((f) => f.title === 'No Docker configuration');
    expect(finding).toBeUndefined();
  });

  it('flags no error monitoring as high with score -20', () => {
    const ctx = makeCtx({
      files: [file('src/index.ts')],
      fileContents: { 'src/index.ts': 'console.log("hello");' },
    });
    const result = analyzeOps(ctx);
    const finding = result.findings.find((f) => f.title === 'No error monitoring detected');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
  });

  it('detects sentry in file contents as error monitoring', () => {
    const ctx = makeCtx({
      files: [file('src/index.ts')],
      fileContents: { 'src/index.ts': 'import * as Sentry from "@sentry/nextjs";' },
    });
    const result = analyzeOps(ctx);
    const finding = result.findings.find((f) => f.title === 'No error monitoring detected');
    expect(finding).toBeUndefined();
  });

  it('flags no health check endpoint as medium with score -10', () => {
    const ctx = makeCtx({
      files: [file('src/index.ts')],
      fileContents: { 'src/index.ts': 'console.log("hello");' },
    });
    const result = analyzeOps(ctx);
    const finding = result.findings.find((f) => f.title === 'No health check endpoint');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
  });

  it('detects health check via file path', () => {
    const ctx = makeCtx({
      files: [file('app/api/health/route.ts')],
    });
    const result = analyzeOps(ctx);
    const finding = result.findings.find((f) => f.title === 'No health check endpoint');
    expect(finding).toBeUndefined();
  });

  it('deep: flags CI YAML missing test step as medium with score -5', () => {
    const ctx = makeCtx({
      files: [file('.github/workflows/ci.yml')],
      fileContents: {
        '.github/workflows/ci.yml': `
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: npm run lint
        `,
      },
    });
    const result = analyzeOps(ctx);
    const finding = result.findings.find((f) => f.title === 'CI pipeline missing "test" step');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
  });

  it('deep: does not flag CI when all steps are present', () => {
    const ctx = makeCtx({
      files: [file('.github/workflows/ci.yml')],
      fileContents: {
        '.github/workflows/ci.yml': `
name: CI
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
        `,
      },
    });
    const result = analyzeOps(ctx);
    const ciMissing = result.findings.filter((f) => f.title.startsWith('CI pipeline missing'));
    expect(ciMissing).toHaveLength(0);
  });

  it('deep: flags Dockerfile without USER directive as medium with score -5', () => {
    const ctx = makeCtx({
      files: [file('Dockerfile')],
      fileContents: {
        'Dockerfile': `
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "server.js"]
        `,
      },
    });
    const result = analyzeOps(ctx);
    const finding = result.findings.find((f) => f.title === 'Dockerfile runs as root');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
  });

  it('deep: does not flag Dockerfile that has USER directive', () => {
    const ctx = makeCtx({
      files: [file('Dockerfile')],
      fileContents: {
        'Dockerfile': `
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]
        `,
      },
    });
    const result = analyzeOps(ctx);
    const finding = result.findings.find((f) => f.title === 'Dockerfile runs as root');
    expect(finding).toBeUndefined();
  });

  it('full ops setup produces high score', () => {
    const ctx = makeCtx({
      files: [
        file('.github/workflows/ci.yml'),
        file('Dockerfile'),
        file('.dockerignore'),
        file('.env.example'),
        file('README.md'),
        file('app/api/health/route.ts'),
      ],
      fileContents: {
        '.github/workflows/ci.yml': `
name: CI
on: push
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
        `,
        'Dockerfile': `
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm ci

FROM node:20-alpine
USER node
CMD ["node", "server.js"]
        `,
        'app/api/health/route.ts': 'export function GET() { return Response.json({ ok: true }); }',
        'src/lib/logger.ts': 'import pino from "pino"; export const logger = pino();',
        'src/instrumentation.ts': 'import * as Sentry from "@sentry/nextjs"; Sentry.init({});',
        'src/env.mjs': 'import { createEnv } from "@t3-oss/env-nextjs";',
      },
    });
    const result = analyzeOps(ctx);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });
});
