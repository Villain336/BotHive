'use client';

import * as Sentry from '@sentry/nextjs';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';

export function SentryUserProvider() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      Sentry.setUser({ id: user.id, email: user.email });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  return null;
}
