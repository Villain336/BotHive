'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Github, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function SignUpPage() {
  const { signInWithGitHub } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Start your free trial</CardTitle>
          <CardDescription>
            14 days free. No credit card required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Connect 1 GitHub repository
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              3 compliance scans per month
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              AI expert chat (10 messages/day)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              All 4 compliance categories
            </li>
          </ul>

          <Button
            onClick={signInWithGitHub}
            className="w-full gap-2"
            size="lg"
          >
            <Github className="h-5 w-5" />
            Sign up with GitHub
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
        <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
