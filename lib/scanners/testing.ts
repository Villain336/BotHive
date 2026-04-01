import type { ScanResult, ScannerFinding, RepoContext } from './types';

const TEST_FILE_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /__tests__\//,
  /\.test\.(py|rb|go|rs)$/,
  /test_.*\.(py|rb)$/,
  /_test\.(go|rs)$/,
];

const TEST_CONFIG_FILES = [
  'jest.config.js', 'jest.config.ts', 'jest.config.mjs',
  'vitest.config.ts', 'vitest.config.js',
  'cypress.config.ts', 'cypress.config.js',
  'playwright.config.ts', 'playwright.config.js',
  'pytest.ini', 'setup.cfg', 'tox.ini',
  '.mocharc.yml', '.mocharc.js',
  'karma.conf.js',
];

const COVERAGE_CONFIG_FILES = [
  '.nycrc', '.nycrc.json', '.c8rc.json',
  'codecov.yml', '.codecov.yml',
  '.coveragerc', 'coverage.py',
];

export function analyzeTests(ctx: RepoContext): ScanResult {
  const findings: ScannerFinding[] = [];
  let score = 100;

  const allFiles = ctx.files.filter((f) => f.type === 'file');
  const sourceFiles = allFiles.filter((f) =>
    /\.(ts|tsx|js|jsx|py|rb|go|rs|java|kt)$/.test(f.path) &&
    !TEST_FILE_PATTERNS.some((p) => p.test(f.path)) &&
    !f.path.includes('node_modules') &&
    !f.path.includes('.next') &&
    !f.path.includes('dist/')
  );

  const testFiles = allFiles.filter((f) =>
    TEST_FILE_PATTERNS.some((p) => p.test(f.path))
  );

  // Check: Do any test files exist?
  if (testFiles.length === 0) {
    findings.push({
      category: 'testing',
      severity: 'critical',
      title: 'No test files found',
      description: 'Your project has no test files. Tests are essential for reliability and catching regressions.',
      fix_suggestion: 'Add unit tests for your key modules. Start with the most critical business logic.',
    });
    score -= 40;
  }

  // Check: Test-to-source ratio
  if (sourceFiles.length > 0 && testFiles.length > 0) {
    const ratio = testFiles.length / sourceFiles.length;
    if (ratio < 0.1) {
      findings.push({
        category: 'testing',
        severity: 'high',
        title: 'Very low test coverage ratio',
        description: `Only ${testFiles.length} test files for ${sourceFiles.length} source files (${Math.round(ratio * 100)}% ratio). Aim for at least 50%.`,
        fix_suggestion: 'Prioritize adding tests for API routes, business logic, and utility functions.',
      });
      score -= 25;
    } else if (ratio < 0.3) {
      findings.push({
        category: 'testing',
        severity: 'medium',
        title: 'Low test coverage ratio',
        description: `${testFiles.length} test files for ${sourceFiles.length} source files (${Math.round(ratio * 100)}% ratio). Good start, but more tests needed.`,
        fix_suggestion: 'Add tests for components, hooks, and edge cases.',
      });
      score -= 15;
    }
  }

  // Check: Test configuration file
  const hasTestConfig = TEST_CONFIG_FILES.some((f) =>
    allFiles.some((af) => af.path === f || af.path.endsWith('/' + f))
  );
  if (!hasTestConfig && testFiles.length > 0) {
    findings.push({
      category: 'testing',
      severity: 'medium',
      title: 'No test configuration file found',
      description: 'No Jest, Vitest, Playwright, or other test runner configuration detected.',
      fix_suggestion: 'Add a test runner config (e.g., jest.config.ts or vitest.config.ts).',
    });
    score -= 10;
  }

  // Check: Test script in package.json
  if (ctx.packageJson) {
    const scripts = (ctx.packageJson.scripts || {}) as Record<string, string>;
    if (!scripts.test || scripts.test.includes('no test specified')) {
      findings.push({
        category: 'testing',
        severity: 'high',
        title: 'No test script in package.json',
        description: 'package.json has no "test" script or it has the default "no test specified" value.',
        fix_suggestion: 'Add a "test" script to package.json, e.g., "test": "jest" or "test": "vitest".',
      });
      score -= 15;
    }

    // Check for test:coverage script
    if (!scripts['test:coverage'] && !scripts.coverage) {
      findings.push({
        category: 'testing',
        severity: 'low',
        title: 'No coverage script',
        description: 'No "test:coverage" or "coverage" script found in package.json.',
        fix_suggestion: 'Add "test:coverage": "jest --coverage" or equivalent to package.json.',
      });
      score -= 5;
    }
  }

  // Check: Coverage configuration
  const hasCoverageConfig = COVERAGE_CONFIG_FILES.some((f) =>
    allFiles.some((af) => af.path === f || af.path.endsWith('/' + f))
  );
  if (!hasCoverageConfig && testFiles.length > 0) {
    findings.push({
      category: 'testing',
      severity: 'low',
      title: 'No coverage reporting configuration',
      description: 'No code coverage configuration (codecov, nyc, c8) detected.',
      fix_suggestion: 'Set up code coverage reporting to track your test coverage over time.',
    });
    score -= 5;
  }

  // Check: E2E test setup
  const hasE2E = allFiles.some((f) =>
    /cypress|playwright|e2e/i.test(f.path) &&
    /\.(test|spec)\.[jt]sx?$/.test(f.path)
  );
  if (!hasE2E) {
    findings.push({
      category: 'testing',
      severity: 'medium',
      title: 'No end-to-end tests detected',
      description: 'No Cypress, Playwright, or other E2E test files found.',
      fix_suggestion: 'Add E2E tests for critical user flows using Playwright or Cypress.',
    });
    score -= 10;
  }

  // Deep check: Assertion density in test files
  const testFileContents = Object.entries(ctx.fileContents).filter(([path]) =>
    TEST_FILE_PATTERNS.some((p) => p.test(path))
  );
  if (testFileContents.length > 0) {
    let totalTests = 0;
    let totalAssertions = 0;
    for (const [, content] of testFileContents) {
      const itCount = (content.match(/\bit\s*\(/g) || []).length;
      const testCount = (content.match(/\btest\s*\(/g) || []).length;
      const expectCount = (content.match(/\bexpect\s*\(/g) || []).length;
      totalTests += itCount + testCount;
      totalAssertions += expectCount;
    }
    if (totalTests > 0 && totalAssertions / totalTests < 1) {
      findings.push({
        category: 'testing',
        severity: 'medium',
        title: 'Low assertion density',
        description: `Average assertions per test is ${(totalAssertions / totalTests).toFixed(2)} (${totalAssertions} assertions across ${totalTests} tests). Each test should have at least one assertion.`,
        fix_suggestion: 'Add expect() assertions to your tests to verify behavior. Tests without assertions provide false confidence.',
      });
      score -= 10;
    }
  }

  // Deep check: API route test coverage
  const apiRouteFiles = ctx.files.filter((f) =>
    f.type === 'file' && /app\/api\//.test(f.path) && /route\.[jt]sx?$/.test(f.path)
  );
  if (apiRouteFiles.length > 0) {
    let untestedRoutes = 0;
    for (const routeFile of apiRouteFiles) {
      const routeSegment = routeFile.path.replace(/^.*app\/api\//, '').replace(/\/route\.[jt]sx?$/, '');
      const hasCorrespondingTest = allFiles.some((f) =>
        f.path.includes('__tests__/api/' + routeSegment) && /\.(test|spec)\.[jt]sx?$/.test(f.path)
      );
      if (!hasCorrespondingTest) {
        untestedRoutes++;
      }
    }
    if (untestedRoutes / apiRouteFiles.length > 0.5) {
      findings.push({
        category: 'testing',
        severity: 'high',
        title: 'API routes missing tests',
        description: `${untestedRoutes} of ${apiRouteFiles.length} API routes have no corresponding test files in __tests__/api/.`,
        fix_suggestion: 'Create test files for your API routes in __tests__/api/ to verify request handling, validation, and responses.',
      });
      score -= 15;
    }
  }

  // Deep check: Testing framework mismatch
  const hasJestConfig = allFiles.some((f) =>
    /jest\.config\.[jt]sx?$|jest\.config\.mjs$/.test(f.path)
  );
  const hasVitestConfig = allFiles.some((f) =>
    /vitest\.config\.[jt]sx?$/.test(f.path)
  );
  if (ctx.packageJson) {
    const deps = {
      ...(ctx.packageJson.dependencies as Record<string, string> || {}),
      ...(ctx.packageJson.devDependencies as Record<string, string> || {}),
    };
    const hasVitestDep = !!deps['vitest'];
    const hasJestDep = !!deps['jest'];
    if (hasJestConfig && hasVitestDep && !hasVitestConfig) {
      findings.push({
        category: 'testing',
        severity: 'medium',
        title: 'Testing framework mismatch',
        description: 'Found jest.config but vitest is listed as a dependency. This may cause confusion about which test runner to use.',
        fix_suggestion: 'Align your test runner: either migrate to vitest and remove jest.config, or remove vitest from dependencies.',
      });
      score -= 5;
    }
    if (hasVitestConfig && hasJestDep && !hasJestConfig) {
      findings.push({
        category: 'testing',
        severity: 'medium',
        title: 'Testing framework mismatch',
        description: 'Found vitest.config but jest is listed as a dependency. This may cause confusion about which test runner to use.',
        fix_suggestion: 'Align your test runner: either migrate to jest and remove vitest.config, or remove jest from dependencies.',
      });
      score -= 5;
    }
  }

  return {
    category: 'testing',
    score: Math.max(0, score),
    findings,
  };
}
