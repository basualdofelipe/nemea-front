'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { ReactElement, ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({
  children,
}: SessionProviderProps): ReactElement {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
