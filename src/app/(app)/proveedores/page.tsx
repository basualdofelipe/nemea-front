import type { ReactElement } from 'react';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { SupplierTable } from '@/components/suppliers/SupplierTable';

interface Supplier {
  id: string;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default async function ProveedoresPage(): Promise<ReactElement> {
  const session = await auth();
  const canEdit = session?.user?.permissions?.canEditSupplies ?? false;

  const response = await apiFetch<{ data: Supplier[] }>('/api/suppliers');

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Proveedores</h1>
        <p className='text-muted-foreground text-sm'>
          Gestiona tus proveedores de insumos.
        </p>
      </div>

      <SupplierTable initialSuppliers={response.data} canEdit={canEdit} />
    </div>
  );
}
