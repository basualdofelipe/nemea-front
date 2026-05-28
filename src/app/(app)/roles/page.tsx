import type { ReactElement } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { RoleRow } from '@/types/role';
import { RolesClient } from './RolesClient';

export default async function RolesPage(): Promise<ReactElement> {
  const session = await auth();
  if (!session?.user?.permissions?.canManageUsers) {
    redirect('/');
  }
  const rolesRes = await apiFetch<{ data: RoleRow[] }>('/api/roles');
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Roles</h1>
          <p className='text-muted-foreground text-sm'>
            Gestiona los roles y permisos del sistema.
          </p>
        </div>
      </div>
      <RolesClient initialRoles={rolesRes.data} />
    </div>
  );
}
