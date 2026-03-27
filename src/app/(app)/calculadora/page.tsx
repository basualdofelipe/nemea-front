import type { ReactElement } from 'react';
import { apiFetch } from '@/lib/api';
import type { Product } from '@/components/products/types';
import type { TiendanubeConfigAll } from '@/components/tiendanube-config/types';
import { CalculadoraClient } from './CalculadoraClient';

export default async function CalculadoraPage(): Promise<ReactElement> {
  const [productsRes, configRes] = await Promise.all([
    apiFetch<{ data: Product[] }>('/api/products'),
    apiFetch<{ data: TiendanubeConfigAll }>('/api/tiendanube-config/all'),
  ]);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Calculadora</h1>
        <p className='text-muted-foreground text-sm'>
          Simula el pricing de tus productos en Tiendanube con tasas reales.
        </p>
      </div>

      <CalculadoraClient products={productsRes.data} config={configRes.data} />
    </div>
  );
}
