import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '@/components/ui/navbar';
import { Footer } from '@/components/ui/footer';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { SentryUserProvider } from '@/components/sentry-user-provider';

export const metadata: Metadata = {
  title: 'ShipReady - Make Your App Production-Ready',
  description: 'AI-powered compliance platform for vibe coders. Get tests, security, legal docs, and ops setup through expert AI chat.',
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
