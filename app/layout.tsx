import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { SentryUserProvider } from '@/components/sentry-user-provider';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shipready.dev';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ShipReady - Make Your App Production-Ready',
    template: '%s | ShipReady',
  },
  description: 'AI-powered compliance platform for vibe coders. Scan your repo for gaps in testing, security, legal, and ops — then fix them through expert AI chat.',
  keywords: ['compliance', 'production-ready', 'testing', 'security', 'devtools', 'AI', 'code review', 'vibe coding'],
  authors: [{ name: 'ShipReady' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ShipReady',
    title: 'ShipReady - Make Your App Production-Ready',
    description: 'Scan your repo, get a compliance score, fix gaps through AI chat. Tests, security, legal docs, and ops in minutes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShipReady - Make Your App Production-Ready',
    description: 'AI-powered compliance for vibe coders. Ship production-ready apps, not just MVPs.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col bg-background">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <SentryUserProvider />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
