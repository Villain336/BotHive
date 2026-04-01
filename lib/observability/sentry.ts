import * as Sentry from '@sentry/nextjs';
import type { NextRequest } from 'next/server';

type RequestLike = NextRequest | Request;

function getPathname(request: RequestLike): string {
  if ('nextUrl' in request && request.nextUrl) {
    return request.nextUrl.pathname;
  }

  try {
    return new URL(request.url).pathname;
  } catch {
    return 'unknown';
  }
}

export function captureApiException(
  error: unknown,
  request: RequestLike,
  context: Record<string, unknown> = {}
) {
  Sentry.withScope((scope) => {
    scope.setTag('request.method', request.method);
    scope.setTag('request.pathname', getPathname(request));

    const requestId = request.headers.get('x-request-id');
    if (requestId) {
      scope.setTag('request.id', requestId);
    }

    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    Sentry.captureException(error);
  });
}
