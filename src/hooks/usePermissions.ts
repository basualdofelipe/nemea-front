'use client';

import { useSession } from 'next-auth/react';
import type { Permissions } from '@/types/permissions';
import { NO_PERMISSIONS } from '@/types/permissions';

export function usePermissions(): Permissions {
  const { data: session } = useSession();
  return session?.user?.permissions ?? NO_PERMISSIONS;
}
