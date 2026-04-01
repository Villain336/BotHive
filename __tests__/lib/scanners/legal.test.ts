import { analyzeLegal } from '@/lib/scanners/legal';
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

describe('analyzeLegal', () => {
  it('returns category "legal"', () => {
    const result = analyzeLegal(makeCtx());
    expect(result.category).toBe('legal');
  });

  it('flags no LICENSE file as high with score -20', () => {
    const ctx = makeCtx({
      files: [file('src/index.ts')],
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'No LICENSE file');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
  });

  it('does not flag when LICENSE file exists', () => {
    const ctx = makeCtx({
      files: [file('LICENSE')],
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'No LICENSE file');
    expect(finding).toBeUndefined();
  });

  it('accepts LICENSE.md as valid license file', () => {
    const ctx = makeCtx({
      files: [file('LICENSE.md')],
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'No LICENSE file');
    expect(finding).toBeUndefined();
  });

  it('flags no privacy policy as critical with score -25', () => {
    const ctx = makeCtx({
      files: [file('src/index.ts')],
      fileContents: { 'src/index.ts': 'console.log("hello");' },
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'No privacy policy found');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('critical');
  });

  it('detects privacy policy from file path', () => {
    const ctx = makeCtx({
      files: [file('app/privacy/page.tsx')],
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'No privacy policy found');
    expect(finding).toBeUndefined();
  });

  it('detects privacy policy from file content (>500 chars)', () => {
    const longPolicy = 'Privacy Policy ' + 'a'.repeat(500);
    const ctx = makeCtx({
      files: [file('app/legal/page.tsx')],
      fileContents: { 'app/legal/page.tsx': longPolicy },
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'No privacy policy found');
    expect(finding).toBeUndefined();
  });

  it('flags no terms of service as high with score -20', () => {
    const ctx = makeCtx({
      files: [file('src/index.ts')],
      fileContents: { 'src/index.ts': 'console.log("hello");' },
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'No terms of service found');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('high');
  });

  it('detects terms of service from file path', () => {
    const ctx = makeCtx({
      files: [file('app/terms/page.tsx')],
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'No terms of service found');
    expect(finding).toBeUndefined();
  });

  it('flags no cookie consent as medium with score -15', () => {
    const ctx = makeCtx({
      files: [file('src/index.ts')],
      fileContents: { 'src/index.ts': 'console.log("hello");' },
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'No cookie consent mechanism');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
  });

  it('detects cookie consent from content', () => {
    const ctx = makeCtx({
      files: [file('components/CookieBanner.tsx')],
      fileContents: { 'components/CookieBanner.tsx': 'export function CookieConsent() { return <div>cookie</div>; }' },
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'No cookie consent mechanism');
    expect(finding).toBeUndefined();
  });

  it('deep: flags incomplete privacy policy with only 2/6 GDPR sections', () => {
    const ctx = makeCtx({
      files: [file('app/privacy/page.tsx')],
      fileContents: {
        'app/privacy/page.tsx': `
          <h1>Privacy Policy</h1>
          <p>We collect personal data for our services.</p>
          <p>You can contact us at support@example.com.</p>
        `,
      },
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'Incomplete privacy policy');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
    expect(finding!.description).toContain('2/6');
    // Missing: data controller, legal basis, retention, rights
    expect(finding!.description).toContain('data controller');
    expect(finding!.description).toContain('legal basis');
    expect(finding!.description).toContain('retention');
    expect(finding!.description).toContain('rights');
  });

  it('deep: complete privacy policy (all 6 GDPR sections) produces no completeness finding', () => {
    const ctx = makeCtx({
      files: [file('app/privacy/page.tsx')],
      fileContents: {
        'app/privacy/page.tsx': `
          <h1>Privacy Policy</h1>
          <p>Data Controller: Example Inc.</p>
          <p>We collect personal data including name and email.</p>
          <p>Legal basis for processing is consent and legitimate interest.</p>
          <p>Retention period is 2 years.</p>
          <p>Your rights include access, rectification, and deletion.</p>
          <p>Contact us at privacy@example.com.</p>
        `,
      },
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'Incomplete privacy policy');
    expect(finding).toBeUndefined();
  });

  it('deep: flags incomplete terms of service with fewer than 3/5 sections', () => {
    const ctx = makeCtx({
      files: [file('app/terms/page.tsx')],
      fileContents: {
        'app/terms/page.tsx': `
          <h1>Terms of Service</h1>
          <p>We provide warranty for our services.</p>
          <p>Some general terms apply.</p>
        `,
      },
    });
    const result = analyzeLegal(ctx);
    const finding = result.findings.find((f) => f.title === 'Incomplete terms of service');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('medium');
    expect(finding!.description).toContain('1/5');
    // Missing: liability, termination, governing law, intellectual property
    expect(finding!.description).toContain('liability');
    expect(finding!.description).toContain('termination');
    expect(finding!.description).toContain('governing law');
  });

  it('full compliance produces high score', () => {
    const privacyContent = `
      Data Controller: Acme Inc. We collect personal data.
      Legal basis: consent. Retention: 1 year.
      Your rights include erasure. Contact: legal@acme.com.
      We use cookie-consent mechanisms. delete-account is available.
      Data processing agreements are in place with our subprocessors.
    `;
    const tosContent = `
      Terms of Service. Liability is limited. Termination may occur.
      Governing law: Delaware. Intellectual property remains ours.
      No warranty is provided.
    `;
    const ctx = makeCtx({
      files: [
        file('LICENSE'),
        file('app/privacy/page.tsx'),
        file('app/terms/page.tsx'),
      ],
      fileContents: {
        'app/privacy/page.tsx': privacyContent,
        'app/terms/page.tsx': tosContent,
      },
    });
    const result = analyzeLegal(ctx);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });
});
