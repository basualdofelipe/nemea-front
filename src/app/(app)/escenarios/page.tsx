import type { ReactElement } from 'react';
import { apiFetch } from '@/lib/api';
import type { Scenario } from '@/components/scenarios/types';
import type { TiendanubeConfigAll } from '@/components/tiendanube-config/types';
import { ScenarioListClient } from './ScenarioListClient';

export default async function EscenariosPage(): Promise<ReactElement> {
  const [scenariosRes, configRes] = await Promise.all([
    apiFetch<{ data: Scenario[] }>('/api/scenarios'),
    apiFetch<{ data: TiendanubeConfigAll }>('/api/tiendanube-config/all'),
  ]);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Escenarios</h1>
        <p className='text-muted-foreground text-sm'>
          Simula cambios de precios y compara margenes sin afectar datos reales.
        </p>
      </div>
      <ScenarioListClient
        initialScenarios={scenariosRes.data}
        config={configRes.data}
      />
    </div>
  );
}
