import 'next-auth';
import 'next-auth/jwt';
import type { Permissions } from './permissions';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      permissions: Permissions;
      email: string;
      name: string;
      image: string;
    };
  }

  interface User {
    permissions?: Permissions;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendToken?: string;
    permissions?: Permissions;
    userId?: string;
  }
}
