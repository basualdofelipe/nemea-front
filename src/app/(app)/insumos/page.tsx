import type { ReactElement } from 'react';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { SupplyTable } from '@/components/supplies/SupplyTable';

interface SupplyType {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Supply {
  id: string;
  name: string;
  type: SupplyType;
  supplier: Supplier;
  unitType: 'm2' | 'unidad' | 'metro' | 'kg';
  notes: string | null;
  isActive: boolean;
  currentPrice: number | null;
  lastPriceUpdate: string | null;
  createdAt: string;
}

export default async function InsumosPage(): Promise<ReactElement> {
  const session = await auth();
  const canEdit = session?.user?.permissions?.canEditSupplies ?? false;

  const [suppliesRes, typesRes, suppliersRes] = await Promise.all([
    apiFetch<{ data: Supply[] }>('/api/supplies?includeInactive=true'),
    apiFetch<{ data: SupplyType[] }>('/api/catalogs/supply-types'),
    apiFetch<{ data: Supplier[] }>('/api/suppliers?active=true'),
  ]);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Insumos</h1>
        <p className='text-muted-foreground text-sm'>
          Gestiona tus insumos y sus precios.
        </p>
      </div>

      <SupplyTable
        initialSupplies={suppliesRes.data}
        supplyTypes={typesRes.data}
        suppliers={suppliersRes.data}
        canEdit={canEdit}
      />
    </div>
  );
}
