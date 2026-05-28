import type { ReactElement } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { TiendanubeConfigClient } from './TiendanubeConfigClient';
import type { TiendanubeConfigAll } from '@/components/tiendanube-config/types';

export default async function TiendanubeConfigPage(): Promise<ReactElement> {
  const session = await auth();

  if (!session?.user?.permissions?.canManageConfig) {
    redirect('/');
  }

  const configRes = await apiFetch<{ data: TiendanubeConfigAll }>(
    '/api/tiendanube-config/all',
  );

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Config Tiendanube
        </h1>
        <p className='text-muted-foreground text-sm'>
          Administra las tasas de pasarelas de pago, cuotas e impuestos para
          Tiendanube.
        </p>
      </div>

      <TiendanubeConfigClient config={configRes.data} />
    </div>
  );
}
