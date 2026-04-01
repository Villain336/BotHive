// Environment variable validation — fails fast at startup if required vars are missing

const requiredServerVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

const optionalServerVars = [
  'ANTHROPIC_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_STARTER_PRICE_ID',
  'STRIPE_PRO_PRICE_ID',
  'STRIPE_TEAM_PRICE_ID',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_SITE_URL',
] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const key of requiredServerVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\n\nCheck .env.example for reference.`
    );
  }

  // Warn about optional vars that affect functionality
  const warnings: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) warnings.push('ANTHROPIC_API_KEY not set — AI chat will not work');
  if (!process.env.STRIPE_SECRET_KEY) warnings.push('STRIPE_SECRET_KEY not set — billing will not work');

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('ShipReady env warnings:\n' + warnings.map((w) => `  ⚠ ${w}`).join('\n'));
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
} as const;
