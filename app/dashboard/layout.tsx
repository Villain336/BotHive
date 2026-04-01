'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  FolderGit2,
  MessageSquare,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  Loader2,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: FolderGit2, label: 'Projects', href: '/dashboard/projects' },
  { icon: MessageSquare, label: 'Chat', href: '/dashboard/chat' },
  { icon: Shield, label: 'Compliance', href: '/dashboard/compliance' },
  { icon: CreditCard, label: 'Billing', href: '/dashboard/settings/billing' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut, initialize, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, router, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div
        className={cn(
          'fixed top-0 left-0 z-40 w-64 h-screen transition-transform bg-card border-r',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <div className="h-full px-3 py-4 flex flex-col">
          <div className="mb-8 px-4">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">ShipReady</h2>
            </Link>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {user.subscription_tier} plan
            </p>
          </div>

          <nav className="space-y-1 flex-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 text-sm rounded-lg',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t pt-4 mt-4">
            <div className="px-4 mb-4 flex items-center gap-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {user.full_name?.charAt(0) || user.email.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </div>

      <div className={cn('transition-all duration-300', isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0')}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
