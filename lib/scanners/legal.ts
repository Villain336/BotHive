import type { ScanResult, ScannerFinding, RepoContext } from './types';

const LICENSE_FILES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md'];
const PRIVACY_PATTERNS = ['privacy', 'privacy-policy', 'privacy_policy'];
const TOS_PATTERNS = ['terms', 'terms-of-service', 'terms_of_service', 'tos'];

export function analyzeLegal(ctx: RepoContext): ScanResult {
  const findings: ScannerFinding[] = [];
  let score = 100;

  const allFiles = ctx.files.filter((f) => f.type === 'file');
  const allPaths = allFiles.map((f) => f.path.toLowerCase());

  // Check: LICENSE file
  const hasLicense = LICENSE_FILES.some((l) =>
    allFiles.some((f) => f.path.toUpperCase() === l.toUpperCase())
  );
  if (!hasLicense) {
    findings.push({
      category: 'legal',
      severity: 'high',
      title: 'No LICENSE file',
      description: 'No license file found in the repository root. This means your code has no explicit license.',
      fix_suggestion: 'Add a LICENSE file. MIT is common for open source; for SaaS, consider a proprietary license.',
    });
    score -= 20;
  }

  // Check: Privacy Policy
  const hasPrivacyPolicy = allPaths.some((p) =>
    PRIVACY_PATTERNS.some((pp) => p.includes(pp))
  ) || Object.values(ctx.fileContents).some((c) =>
    c.toLowerCase().includes('privacy policy') && c.length > 500
  );
  if (!hasPrivacyPolicy) {
    findings.push({
      category: 'legal',
      severity: 'critical',
      title: 'No privacy policy found',
      description: 'No privacy policy page or document detected. Required by GDPR, CCPA, and most app stores.',
      fix_suggestion: 'Create a /privacy page with your privacy policy. Include data collection, usage, storage, and user rights.',
    });
    score -= 25;
  }

  // Check: Terms of Service
  const hasToS = allPaths.some((p) =>
    TOS_PATTERNS.some((tp) => p.includes(tp))
  ) || Object.values(ctx.fileContents).some((c) =>
    c.toLowerCase().includes('terms of service') && c.length > 500
  );
  if (!hasToS) {
    findings.push({
      category: 'legal',
      severity: 'high',
      title: 'No terms of service found',
      description: 'No terms of service page or document detected. Essential for SaaS applications.',
      fix_suggestion: 'Create a /terms page with your terms of service covering usage, liability, and dispute resolution.',
    });
    score -= 20;
  }

  // Check: Cookie consent
  const hasCookieConsent = Object.values(ctx.fileContents).some((c) =>
    c.includes('cookie-consent') ||
    c.includes('CookieConsent') ||
    c.includes('cookieConsent') ||
    c.includes('cookie banner') ||
    c.includes('gdpr')
  );
  if (!hasCookieConsent) {
    findings.push({
      category: 'legal',
      severity: 'medium',
      title: 'No cookie consent mechanism',
      description: 'No cookie consent banner or GDPR consent mechanism detected.',
      fix_suggestion: 'Add a cookie consent banner that allows users to opt in/out of non-essential cookies.',
    });
    score -= 15;
  }

  // Check: Data deletion / user rights
  const hasDataDeletion = Object.values(ctx.fileContents).some((c) =>
    c.includes('delete-account') ||
    c.includes('deleteAccount') ||
    c.includes('account deletion') ||
    c.includes('right to erasure') ||
    c.includes('data deletion')
  );
  if (!hasDataDeletion) {
    findings.push({
      category: 'legal',
      severity: 'medium',
      title: 'No account/data deletion feature',
      description: 'No account deletion or data erasure functionality detected. Required by GDPR Article 17.',
      fix_suggestion: 'Implement an account deletion feature that removes all user data upon request.',
    });
    score -= 10;
  }

  // Check: Data Processing Agreement references
  const hasDPA = Object.values(ctx.fileContents).some((c) =>
    c.toLowerCase().includes('data processing') ||
    c.toLowerCase().includes('dpa') ||
    c.toLowerCase().includes('subprocessor')
  );
  if (!hasDPA) {
    findings.push({
      category: 'legal',
      severity: 'low',
      title: 'No data processing documentation',
      description: 'No data processing agreement or subprocessor documentation found.',
      fix_suggestion: 'Document your data processing practices and list subprocessors (Supabase, Stripe, etc.).',
    });
    score -= 5;
  }

  // Deep check: Privacy policy completeness (GDPR)
  const gdprKeywords = ['data controller', 'personal data', 'legal basis', 'retention', 'rights', 'contact'];
  for (const [path, content] of Object.entries(ctx.fileContents)) {
    if (!path.toLowerCase().includes('privacy')) continue;
    const lowerContent = content.toLowerCase();
    const foundSections = gdprKeywords.filter((kw) => lowerContent.includes(kw));
    if (foundSections.length < 4) {
      findings.push({
        category: 'legal',
        severity: 'medium',
        title: 'Incomplete privacy policy',
        description: `Privacy policy at ${path} only covers ${foundSections.length}/6 required GDPR sections. Missing: ${gdprKeywords.filter((kw) => !lowerContent.includes(kw)).join(', ')}.`,
        file_path: path,
        fix_suggestion: 'Update your privacy policy to include all GDPR-required sections: data controller, personal data, legal basis, retention, rights, and contact information.',
      });
      score -= 10;
    }
    break; // Only check the first privacy policy file found
  }

  // Deep check: Terms of Service completeness
  const tosKeywords = ['liability', 'termination', 'governing law', 'intellectual property', 'warranty'];
  for (const [path, content] of Object.entries(ctx.fileContents)) {
    const lowerPath = path.toLowerCase();
    if (!TOS_PATTERNS.some((tp) => lowerPath.includes(tp))) continue;
    const lowerContent = content.toLowerCase();
    const foundSections = tosKeywords.filter((kw) => lowerContent.includes(kw));
    if (foundSections.length < 3) {
      findings.push({
        category: 'legal',
        severity: 'medium',
        title: 'Incomplete terms of service',
        description: `Terms of service at ${path} only covers ${foundSections.length}/5 recommended sections. Missing: ${tosKeywords.filter((kw) => !lowerContent.includes(kw)).join(', ')}.`,
        file_path: path,
        fix_suggestion: 'Update your terms of service to cover: liability, termination, governing law, intellectual property, and warranty.',
      });
      score -= 10;
    }
    break; // Only check the first ToS file found
  }

  return {
    category: 'legal',
    score: Math.max(0, score),
    findings,
  };
}
