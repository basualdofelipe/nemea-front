import type { ReactElement } from 'react';
import { apiFetch } from '@/lib/api';
import type { Scenario } from '@/components/scenarios/types';
import type { Product } from '@/components/products/types';
import type { TiendanubeConfigAll } from '@/components/tiendanube-config/types';
import { ScenarioEditorClient } from './ScenarioEditorClient';

export default async function ScenarioEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  const [scenarioRes, productsRes, configRes] = await Promise.all([
    apiFetch<{ data: Scenario }>(`/api/scenarios/${id}`),
    apiFetch<{ data: Product[] }>('/api/products'),
    apiFetch<{ data: TiendanubeConfigAll }>('/api/tiendanube-config/all'),
  ]);

  return (
    <ScenarioEditorClient
      scenario={scenarioRes.data}
      products={productsRes.data}
      config={configRes.data}
    />
  );
}
