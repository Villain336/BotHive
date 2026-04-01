import { runFullScan } from '@/lib/scanners';
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

describe('runFullScan', () => {
  it('returns all 4 category results', () => {
    const result = runFullScan(makeCtx());
    expect(result.results).toHaveLength(4);
    const categories = result.results.map((r) => r.category).sort();
    expect(categories).toEqual(['legal', 'ops', 'security', 'testing']);
  });

  it('calculates weighted overall score: test*0.4 + security*0.25 + legal*0.15 + ops*0.2', () => {
    const result = runFullScan(makeCtx());
    const expected = Math.round(
      result.test_score * 0.4 +
      result.security_score * 0.25 +
      result.legal_score * 0.15 +
      result.ops_score * 0.2
    );
    expect(result.overall_score).toBe(expected);
  });

  it('empty repo produces valid structure with all score fields', () => {
    const result = runFullScan(makeCtx());
    expect(typeof result.overall_score).toBe('number');
    expect(typeof result.test_score).toBe('number');
    expect(typeof result.security_score).toBe('number');
    expect(typeof result.legal_score).toBe('number');
    expect(typeof result.ops_score).toBe('number');
    expect(result.overall_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_score).toBeLessThanOrEqual(100);
  });

  it('individual scores match the per-scanner results', () => {
    const ctx = makeCtx({
      files: [file('src/index.ts')],
      fileContents: { 'src/index.ts': 'console.log("hello");' },
    });
    const result = runFullScan(ctx);
    expect(result.test_score).toBe(result.results.find((r) => r.category === 'testing')!.score);
    expect(result.security_score).toBe(result.results.find((r) => r.category === 'security')!.score);
    expect(result.legal_score).toBe(result.results.find((r) => r.category === 'legal')!.score);
    expect(result.ops_score).toBe(result.results.find((r) => r.category === 'ops')!.score);
  });

  it('well-configured repo gets higher overall score than empty repo', () => {
    const emptyResult = runFullScan(makeCtx());

    const goodCtx = makeCtx({
      files: [
        file('src/index.ts'),
        file('src/__tests__/index.test.ts'),
        file('jest.config.ts'),
        file('e2e/flow.spec.ts'),
        file('.nycrc'),
        file('.gitignore'),
        file('middleware.ts'),
        file('LICENSE'),
        file('app/privacy/page.tsx'),
        file('app/terms/page.tsx'),
        file('.github/workflows/ci.yml'),
        file('Dockerfile'),
        file('.dockerignore'),
        file('.env.example'),
        file('README.md'),
        file('app/api/health/route.ts'),
      ],
      fileContents: {
        'src/__tests__/index.test.ts': 'test("works", () => { expect(true).toBe(true); });',
        '.gitignore': '.env\nnode_modules',
        'middleware.ts': 'import { getToken } from "next-auth/jwt"; export function middleware() {}',
        'app/privacy/page.tsx': 'Data Controller info. Personal data collected. Legal basis: consent. Retention: 1y. Your rights. Contact us.',
        'app/terms/page.tsx': 'Liability limited. Termination clause. Governing law: DE. Intellectual property. Warranty disclaimer.',
        '.github/workflows/ci.yml': 'steps:\n  - uses: actions/checkout@v4\n  - run: npm ci\n  - run: npm run lint\n  - run: npm test\n  - run: npm run build',
        'Dockerfile': 'FROM node:20\nFROM node:20-slim\nUSER node',
        'app/api/health/route.ts': 'export function GET() {}',
        'lib/sentry.ts': 'import * as Sentry from "@sentry/nextjs";',
        'lib/logger.ts': 'import pino from "pino"; export const logger = pino();',
        'src/env.mjs': 'createEnv({})',
        'components/CookieBanner.tsx': '<CookieConsent />',
        'app/settings/page.tsx': 'deleteAccount()',
        'lib/dpa.tsx': 'data processing agreement with subprocessor list',
      },
      packageJson: {
        scripts: { test: 'jest', 'test:coverage': 'jest --coverage' },
        devDependencies: { '@typescript-eslint/eslint-plugin': '^6.0.0' },
      },
    });
    const goodResult = runFullScan(goodCtx);
    expect(goodResult.overall_score).toBeGreaterThan(emptyResult.overall_score);
  });
});
