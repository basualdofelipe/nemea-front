import type { ReactElement } from 'react';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import { ProductTable } from '@/components/products/ProductTable';
import type { CatalogItem, Product } from '@/components/products/types';
import type { SupplyOption } from '@/types/supply';

export default async function ProductosPage(): Promise<ReactElement> {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';

  const [
    productsRes,
    typesRes,
    namesRes,
    finishesRes,
    colorsRes,
    sizesRes,
    suppliesRes,
  ] = await Promise.all([
    apiFetch<{ data: Product[] }>('/api/products?includeInactive=true'),
    apiFetch<{ data: CatalogItem[] }>('/api/catalogs/product-types'),
    apiFetch<{ data: CatalogItem[] }>('/api/catalogs/product-names'),
    apiFetch<{ data: CatalogItem[] }>('/api/catalogs/product-finishes'),
    apiFetch<{ data: CatalogItem[] }>('/api/catalogs/product-colors'),
    apiFetch<{ data: CatalogItem[] }>('/api/catalogs/product-sizes'),
    apiFetch<{ data: SupplyOption[] }>('/api/supplies'),
  ]);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Productos</h1>
        <p className='text-muted-foreground text-sm'>
          Gestiona tus productos, materiales y precios de venta.
        </p>
      </div>

      <ProductTable
        initialProducts={productsRes.data}
        types={typesRes.data}
        names={namesRes.data}
        finishes={finishesRes.data}
        colors={colorsRes.data}
        sizes={sizesRes.data}
        supplies={suppliesRes.data}
        isAdmin={isAdmin}
      />
    </div>
  );
}
