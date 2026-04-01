import { analyzeSecurity } from '@/lib/scanners/security';
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

describe('analyzeSecurity', () => {
  it('returns category "security"', () => {
    const result = analyzeSecurity(makeCtx());
    expect(result.category).toBe('security');
  });

  it('flags .env file in repo as critical with score -25', () => {
    const ctx = makeCtx({
      files: [file('.env')],
      fileContents: { '.gitignore': '.env\nnode_modules' },
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title === '.env file found in repository');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
    expect(finding!.description).toContain('.env');
  });

  it('does not flag .env.example files', () => {
    const ctx = makeCtx({
      files: [file('.env.example')],
      fileContents: { '.gitignore': '.env\nnode_modules' },
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title === '.env file found in repository');
    expect(finding).toBeUndefined();
  });

  it('flags missing .gitignore as high with score -15', () => {
    const ctx = makeCtx({
      files: [file('src/index.ts')],
      fileContents: {},
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title === 'No .gitignore file');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
  });

  it('flags .gitignore without .env entry as high with score -15', () => {
    const ctx = makeCtx({
      files: [file('.gitignore')],
      fileContents: { '.gitignore': 'node_modules\ndist\n' },
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title === '.env not in .gitignore');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
  });

  it('does not flag .gitignore that includes .env', () => {
    const ctx = makeCtx({
      files: [file('.gitignore')],
      fileContents: { '.gitignore': 'node_modules\n.env\ndist\n' },
    });
    const result = analyzeSecurity(ctx);
    expect(result.findings.find((f) => f.title === 'No .gitignore file')).toBeUndefined();
    expect(result.findings.find((f) => f.title === '.env not in .gitignore')).toBeUndefined();
  });

  it('flags hardcoded API key in source as critical with score -20', () => {
    const ctx = makeCtx({
      files: [file('src/config.ts'), file('.gitignore')],
      fileContents: {
        'src/config.ts': 'const config = { api_key: "sk_live_abcdefghij1234567890" };',
        '.gitignore': '.env',
      },
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title.includes('API Key'));
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
    expect(finding!.file_path).toBe('src/config.ts');
  });

  it('flags no security headers in next.config as medium with score -10', () => {
    const ctx = makeCtx({
      files: [file('next.config.js'), file('.gitignore')],
      fileContents: {
        'next.config.js': 'module.exports = { reactStrictMode: true };',
        '.gitignore': '.env',
      },
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title === 'No security headers configured');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
  });

  it('does not flag security headers when "headers" is present in next.config', () => {
    const ctx = makeCtx({
      files: [file('next.config.js'), file('.gitignore')],
      fileContents: {
        'next.config.js': 'module.exports = { async headers() { return []; } };',
        '.gitignore': '.env',
      },
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title === 'No security headers configured');
    expect(finding).toBeUndefined();
  });

  it('flags no rate limiting as medium with score -10', () => {
    const ctx = makeCtx({
      files: [file('src/index.ts'), file('.gitignore')],
      fileContents: {
        'src/index.ts': 'console.log("hello");',
        '.gitignore': '.env',
      },
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title === 'No rate limiting detected');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
  });

  it('deep: flags API route missing validation as high with score -10', () => {
    const ctx = makeCtx({
      files: [file('app/api/users/route.ts'), file('.gitignore')],
      fileContents: {
        'app/api/users/route.ts': `
          export async function POST(req: Request) {
            const body = await req.json();
            return Response.json({ ok: true });
          }
        `,
        '.gitignore': '.env',
      },
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title === 'API route missing input validation');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
    expect(finding!.file_path).toBe('app/api/users/route.ts');
  });

  it('deep: does not flag API route that imports zod', () => {
    const ctx = makeCtx({
      files: [file('app/api/users/route.ts'), file('.gitignore')],
      fileContents: {
        'app/api/users/route.ts': `
          import { z } from 'zod';
          export async function POST(req: Request) {
            const body = z.object({ name: z.string() }).parse(await req.json());
            return Response.json({ ok: true });
          }
        `,
        '.gitignore': '.env',
      },
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title === 'API route missing input validation');
    expect(finding).toBeUndefined();
  });

  it('deep: flags middleware missing auth checks as high with score -10', () => {
    const ctx = makeCtx({
      files: [file('middleware.ts'), file('.gitignore')],
      fileContents: {
        'middleware.ts': `
          import { NextResponse } from 'next/server';
          export function middleware() {
            return NextResponse.next();
          }
        `,
        '.gitignore': '.env',
      },
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title === 'Middleware missing auth checks');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
  });

  it('deep: does not flag middleware that includes auth logic', () => {
    const ctx = makeCtx({
      files: [file('middleware.ts'), file('.gitignore')],
      fileContents: {
        'middleware.ts': `
          import { getToken } from 'next-auth/jwt';
          export async function middleware(req) {
            const token = await getToken({ req });
            if (!token) return NextResponse.redirect('/login');
            return NextResponse.next();
          }
        `,
        '.gitignore': '.env',
      },
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title === 'Middleware missing auth checks');
    expect(finding).toBeUndefined();
  });

  it('deep: flags error.stack exposed in API response as medium', () => {
    const ctx = makeCtx({
      files: [file('app/api/data/route.ts'), file('.gitignore')],
      fileContents: {
        'app/api/data/route.ts': `
          import { z } from 'zod';
          export async function GET() {
            try {
              return Response.json({ data: [] });
            } catch (error) {
              return Response.json({ stack: error.stack }, { status: 500 });
            }
          }
        `,
        '.gitignore': '.env',
      },
    });
    const result = analyzeSecurity(ctx);
    const finding = result.findings.find((f) => f.title === 'Error details exposed in API response');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
    expect(finding!.description).toContain('error.stack');
  });

  it('clean repo with all security measures produces high score', () => {
    const ctx = makeCtx({
      files: [
        file('.gitignore'),
        file('next.config.js'),
        file('middleware.ts'),
        file('lib/rate-limit.ts'),
      ],
      fileContents: {
        '.gitignore': '.env\nnode_modules\n',
        'next.config.js': 'module.exports = { async headers() { return []; } };',
        'middleware.ts': `
          import { getSession } from 'next-auth';
          export function middleware() {}
        `,
        'lib/rate-limit.ts': 'export function rateLimit() {}',
      },
      packageJson: {
        devDependencies: { '@typescript-eslint/eslint-plugin': '^6.0.0' },
      },
    });
    const result = analyzeSecurity(ctx);
    expect(result.score).toBeGreaterThanOrEqual(85);
  });
});
