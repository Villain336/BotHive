'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Github, Shield } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function SignInPage() {
  const { signInWithGitHub } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to ShipReady to continue making your apps production-ready
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={signInWithGitHub}
            className="w-full gap-2"
            size="lg"
          >
            <Github className="h-5 w-5" />
            Sign in with GitHub
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            We use GitHub OAuth to access your repositories for scanning.
            We only request the permissions we need.
          </p>
        </CardContent>
        <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/sign-up" className="text-primary hover:underline">
            Start free trial
          </Link>
        </div>
      </Card>
    </div>
  );
}
