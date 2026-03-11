import type { ReactElement } from 'react';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch } from '@/lib/api';
import type {
  BomItem,
  CatalogItem,
  Product,
} from '@/components/products/types';
import { ProductDetailClient } from '@/components/products/ProductDetailClient';

interface ProductWithCostResponse extends Product {
  costBreakdown: Array<{
    supplyId: string;
    supplyName: string;
    supplyType: string;
    quantity: number;
    unitType: string;
    unitPrice: number | null;
    lineCost: number | null;
    isSupplyActive: boolean;
  }> | null;
}

interface SupplyOption {
  id: string;
  name: string;
  unitType: 'm2' | 'unidad' | 'metro' | 'kg';
  isActive: boolean;
  type: { name: string };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';

  let productData: ProductWithCostResponse;
  try {
    const res = await apiFetch<{ data: ProductWithCostResponse }>(
      `/api/products/${id}`,
    );
    productData = res.data;
  } catch {
    notFound();
  }

  const [
    bomRes,
    typesRes,
    namesRes,
    finishesRes,
    colorsRes,
    sizesRes,
    suppliesRes,
  ] = await Promise.all([
    apiFetch<{ data: BomItem[] }>(`/api/products/${id}/bom`),
    apiFetch<{ data: CatalogItem[] }>('/api/catalogs/product-types'),
    apiFetch<{ data: CatalogItem[] }>('/api/catalogs/product-names'),
    apiFetch<{ data: CatalogItem[] }>('/api/catalogs/product-finishes'),
    apiFetch<{ data: CatalogItem[] }>('/api/catalogs/product-colors'),
    apiFetch<{ data: CatalogItem[] }>('/api/catalogs/product-sizes'),
    apiFetch<{ data: SupplyOption[] }>('/api/supplies'),
  ]);

  return (
    <ProductDetailClient
      product={productData}
      bomItems={bomRes.data}
      types={typesRes.data}
      names={namesRes.data}
      finishes={finishesRes.data}
      colors={colorsRes.data}
      sizes={sizesRes.data}
      supplies={suppliesRes.data}
      isAdmin={isAdmin}
    />
  );
}
