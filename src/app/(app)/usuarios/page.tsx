import type { ReactElement } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { UsersClient } from './UsersClient';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: { id: string; name: string } | string;
  isActive: boolean;
  createdAt: string;
}

export default async function UsuariosPage(): Promise<ReactElement> {
  const session = await auth();

  if (!session?.user?.permissions?.canManageUsers) {
    redirect('/');
  }

  const usersRes = await apiFetch<{ data: UserRow[] }>('/api/users');

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Usuarios</h1>
        <p className='text-muted-foreground text-sm'>
          Gestiona los usuarios del sistema.
        </p>
      </div>

      <UsersClient users={usersRes.data} />
    </div>
  );
}
