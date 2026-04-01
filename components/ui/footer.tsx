import { Shield, Github, Twitter } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-xl">
              <Shield className="h-6 w-6 text-primary" />
              ShipReady
            </div>
            <p className="text-sm text-muted-foreground">
              Make your app production-ready. AI-powered compliance, testing, security, and ops for vibe coders.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Compliance Areas</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">Testing & Coverage</li>
              <li className="text-muted-foreground">Security & Auth</li>
              <li className="text-muted-foreground">Legal & Privacy</li>
              <li className="text-muted-foreground">Ops & Infrastructure</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ShipReady. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
