'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { Github, User } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">Manage your account and preferences</p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm text-muted-foreground">{user?.full_name || 'Not set'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Connection
            </CardTitle>
            <CardDescription>Connected GitHub account for repo access</CardDescription>
          </CardHeader>
          <CardContent>
            {user?.github_username ? (
              <p className="text-sm">Connected as <strong>@{user.github_username}</strong></p>
            ) : (
              <p className="text-sm text-muted-foreground">
                GitHub is connected through your sign-in. Your repos are accessible for scanning.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Manage your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings/billing">
              <Button variant="outline">Manage Billing</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
