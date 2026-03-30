import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import type { Permissions } from '@/types/permissions';
import { NO_PERMISSIONS } from '@/types/permissions';

interface BackendAuthResponse {
  data: {
    accessToken: string;
    user: {
      id: string;
      email: string;
      permissions: Permissions;
      name: string | null;
      pictureUrl: string | null;
    };
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    signIn({ account }): boolean {
      if (account?.provider === 'google') {
        return true;
      }
      return false;
    },
    async jwt({ token, account }): Promise<typeof token> {
      if (account?.provider === 'google') {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: account.id_token }),
            },
          );
          if (res.ok) {
            const body = (await res.json()) as BackendAuthResponse;
            token.backendToken = body.data.accessToken;
            token.permissions = body.data.user.permissions;
            token.userId = String(body.data.user.id);
          }
        } catch {
          // Backend unreachable — token won't have backendToken
          // middleware.ts will redirect to /acceso-denegado on next navigation
        }
      }

      // Stale JWT detection: old tokens have token.role (string), not token.permissions
      // Force re-authentication by clearing the stale session data
      if (
        (token as Record<string, unknown>)['role'] !== undefined &&
        token.permissions === undefined
      ) {
        // Old-format token detected. Delete the stale 'role' key and leave permissions undefined.
        // NextAuth will see the missing data and the session callback will use NO_PERMISSIONS,
        // effectively forcing the user to re-login on their next request.
        delete (token as Record<string, unknown>)['role'];
        // Clear the backend token too, which will trigger re-auth via the signIn flow
        token.backendToken = undefined;
      }

      return token;
    },
    session({ session, token }): typeof session {
      session.accessToken = (token.backendToken as string) ?? '';
      session.user.permissions =
        (token.permissions as Permissions) ?? NO_PERMISSIONS;
      session.user.id = (token.userId as string) ?? '';
      return session;
    },
  },
});
