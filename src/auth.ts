import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

interface BackendAuthResponse {
  data: {
    accessToken: string;
    user: {
      id: number;
      email: string;
      role: string;
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
            token.role = body.data.user.role;
            token.userId = String(body.data.user.id);
          }
        } catch {
          // Backend unreachable — token won't have backendToken
          // proxy.ts will redirect to /acceso-denegado on next navigation
        }
      }
      return token;
    },
    session({ session, token }): typeof session {
      session.accessToken = (token.backendToken as string) ?? '';
      session.user.role = (token.role as string) ?? '';
      session.user.id = (token.userId as string) ?? '';
      return session;
    },
  },
});
