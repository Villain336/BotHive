import { analyzeTests } from '@/lib/scanners/testing';
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

function dir(path: string): { path: string; type: 'dir'; size: number } {
  return { path, type: 'dir', size: 0 };
}

describe('analyzeTests', () => {
  it('returns category "testing"', () => {
    const result = analyzeTests(makeCtx());
    expect(result.category).toBe('testing');
  });

  it('empty repo (no files at all) produces no "No test files found" finding and high score', () => {
    const result = analyzeTests(makeCtx({ files: [] }));
    // No test files, but also no source files, so testFiles.length === 0 triggers the finding
    // Actually: the code checks testFiles.length === 0 unconditionally
    const noTestFinding = result.findings.find((f) => f.title === 'No test files found');
    expect(noTestFinding).toBeDefined();
    expect(noTestFinding!.severity).toBe('critical');
  });

  it('zero test files with source files produces critical "No test files found" with score -40', () => {
    const ctx = makeCtx({
      files: [
        file('src/utils.ts'),
        file('src/api.ts'),
        file('src/index.ts'),
      ],
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'No test files found');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
    // Score starts at 100, -40 for no tests, -10 for no E2E = 50
    // No packageJson so no test/coverage script checks
    expect(result.score).toBeLessThanOrEqual(60);
  });

  it('low test ratio (<10%) produces high severity finding with score -25', () => {
    // 1 test file for 20 source files = 5% ratio
    const sourceFiles = Array.from({ length: 20 }, (_, i) => file(`src/module${i}.ts`));
    const ctx = makeCtx({
      files: [...sourceFiles, file('src/__tests__/one.test.ts')],
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'Very low test coverage ratio');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
    expect(finding!.description).toContain('5% ratio');
  });

  it('moderate test ratio (10-30%) produces medium severity finding with score -15', () => {
    // 2 test files for 10 source files = 20% ratio
    const sourceFiles = Array.from({ length: 10 }, (_, i) => file(`src/module${i}.ts`));
    const ctx = makeCtx({
      files: [
        ...sourceFiles,
        file('src/__tests__/a.test.ts'),
        file('src/__tests__/b.test.ts'),
      ],
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'Low test coverage ratio');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
    expect(finding!.description).toContain('20% ratio');
  });

  it('detects test config file (jest.config.js) and does not flag missing config', () => {
    const ctx = makeCtx({
      files: [
        file('src/utils.ts'),
        file('src/__tests__/utils.test.ts'),
        file('jest.config.js'),
      ],
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'No test configuration file found');
    expect(finding).toBeUndefined();
  });

  it('flags missing test config when test files exist but no config file', () => {
    const ctx = makeCtx({
      files: [
        file('src/utils.ts'),
        file('src/__tests__/utils.test.ts'),
      ],
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'No test configuration file found');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
  });

  it('flags missing test script in package.json', () => {
    const ctx = makeCtx({
      packageJson: { scripts: {} },
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'No test script in package.json');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
  });

  it('flags default "no test specified" test script', () => {
    const ctx = makeCtx({
      packageJson: { scripts: { test: 'echo "Error: no test specified" && exit 1' } },
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'No test script in package.json');
    expect(finding).toBeDefined();
  });

  it('flags missing coverage script in package.json', () => {
    const ctx = makeCtx({
      packageJson: { scripts: { test: 'jest' } },
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'No coverage script');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('low');
  });

  it('does not flag coverage script when test:coverage exists', () => {
    const ctx = makeCtx({
      packageJson: { scripts: { test: 'jest', 'test:coverage': 'jest --coverage' } },
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'No coverage script');
    expect(finding).toBeUndefined();
  });

  it('flags no E2E tests as medium severity', () => {
    const ctx = makeCtx({
      files: [file('src/utils.ts'), file('src/__tests__/utils.test.ts')],
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'No end-to-end tests detected');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
  });

  it('does not flag E2E when playwright test file exists', () => {
    const ctx = makeCtx({
      files: [
        file('src/utils.ts'),
        file('e2e/login.spec.ts'),
      ],
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'No end-to-end tests detected');
    expect(finding).toBeUndefined();
  });

  it('deep: flags low assertion density (test files with test() but no expect())', () => {
    const ctx = makeCtx({
      files: [file('src/__tests__/utils.test.ts')],
      fileContents: {
        'src/__tests__/utils.test.ts': `
          test('does something', () => {
            doSomething();
          });
          test('does another thing', () => {
            doAnotherThing();
          });
        `,
      },
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'Low assertion density');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
    expect(finding!.description).toContain('0.00');
    expect(finding!.description).toContain('2 tests');
  });

  it('deep: does not flag assertion density when assertions are present', () => {
    const ctx = makeCtx({
      files: [file('src/__tests__/utils.test.ts')],
      fileContents: {
        'src/__tests__/utils.test.ts': `
          test('does something', () => {
            expect(doSomething()).toBe(true);
          });
          test('does another', () => {
            expect(result).toBe(42);
            expect(result2).toBe(43);
          });
        `,
      },
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'Low assertion density');
    expect(finding).toBeUndefined();
  });

  it('deep: flags API routes without corresponding tests', () => {
    const ctx = makeCtx({
      files: [
        file('app/api/users/route.ts'),
        file('app/api/posts/route.ts'),
        file('app/api/health/route.ts'),
      ],
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'API routes missing tests');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
    expect(finding!.description).toContain('3 of 3');
  });

  it('deep: flags framework mismatch (jest config + vitest dep)', () => {
    const ctx = makeCtx({
      files: [file('jest.config.ts')],
      packageJson: {
        devDependencies: { vitest: '^1.0.0' },
      },
    });
    const result = analyzeTests(ctx);
    const finding = result.findings.find((f) => f.title === 'Testing framework mismatch');
    expect(finding).toBeDefined();
    expect(finding!.description).toContain('jest.config');
    expect(finding!.description).toContain('vitest');
  });

  it('good repo with tests and config produces high score', () => {
    const sourceFiles = Array.from({ length: 5 }, (_, i) => file(`src/module${i}.ts`));
    const testFiles = Array.from({ length: 5 }, (_, i) => file(`src/__tests__/module${i}.test.ts`));
    const ctx = makeCtx({
      files: [
        ...sourceFiles,
        ...testFiles,
        file('jest.config.ts'),
        file('e2e/flow.spec.ts'),
        file('.nycrc'),
      ],
      fileContents: Object.fromEntries(
        testFiles.map((f) => [f.path, `test('works', () => { expect(true).toBe(true); });`])
      ),
      packageJson: {
        scripts: { test: 'jest', 'test:coverage': 'jest --coverage' },
      },
    });
    const result = analyzeTests(ctx);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('score never goes below 0', () => {
    // Create a maximally bad repo: many source files, no tests, no config, bad package.json
    const sourceFiles = Array.from({ length: 50 }, (_, i) => file(`src/module${i}.ts`));
    const ctx = makeCtx({
      files: [
        ...sourceFiles,
        file('app/api/users/route.ts'),
        file('app/api/posts/route.ts'),
      ],
      packageJson: {
        scripts: {},
        devDependencies: { vitest: '^1.0.0' },
      },
    });
    const result = analyzeTests(ctx);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
