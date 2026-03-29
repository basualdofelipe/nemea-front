'use client';

import type { ReactElement } from 'react';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { apiClientFetch } from '@/lib/api-client';
import type { Product } from '@/components/products/types';
import type { TiendanubeConfigAll } from '@/components/tiendanube-config/types';
import type {
  Scenario,
  ScenarioProductResult,
  ScenarioCalcResponse,
  GatewayPlanConfig,
} from '@/components/scenarios/types';
import { ProductOverrideTable } from '@/components/scenarios/ProductOverrideTable';
import { BulkOverrideDialog } from '@/components/scenarios/BulkOverrideDialog';
import { GatewayPlanSelector } from '@/components/scenarios/GatewayPlanSelector';
import { MarginSummary } from '@/components/scenarios/MarginSummary';

interface ScenarioEditorClientProps {
  scenario: Scenario;
  products: Product[];
  config: TiendanubeConfigAll;
}

export function ScenarioEditorClient({
  scenario,
  products,
  config,
}: ScenarioEditorClientProps): ReactElement {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const currentUserId = session?.user?.id;
  const isOwner = scenario.user.id === currentUserId;

  // Initialize overrides from scenario data
  const [overridesState, setOverridesState] = useState<Record<string, number>>(
    () =>
      Object.fromEntries(
        (scenario.overrides ?? []).map((o) => [
          o.product.id,
          parseFloat(o.overridePrice),
        ]),
      ),
  );

  const [gatewayPlanConfig, setGatewayPlanConfig] = useState<GatewayPlanConfig>(
    {
      gatewaySlug: scenario.gatewaySlug ?? 'pago_nube',
      paymentMethod: scenario.paymentMethod ?? 'tarjeta_debito_credito',
      withdrawalDays: scenario.withdrawalDays ?? 1,
      installments: scenario.installments ?? 1,
      planId:
        scenario.plan?.id ??
        config.plans.find((p) => p.slug === 'esencial')?.id ??
        '',
    },
  );

  const [calcResults, setCalcResults] = useState<
    ScenarioProductResult[] | null
  >(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState<boolean>(scenario.isPublic);
  const [resetKey, setResetKey] = useState<number>(0);

  const handleGatewayPlanChange = useCallback(
    (newConfig: GatewayPlanConfig): void => {
      setGatewayPlanConfig(newConfig);
    },
    [],
  );

  const handleOverrideChange = useCallback(
    (productId: string, value: number | null): void => {
      setOverridesState((prev) => {
        if (value === null) {
          const { [productId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [productId]: value };
      });
    },
    [],
  );

  function handleClearOverrides(): void {
    setOverridesState({});
    setResetKey((k) => k + 1);
    toast('Overrides limpiados');
  }

  function handleBulkOverride(
    filterTypeId: string | 'all',
    percentage: number,
  ): void {
    const newOverrides = { ...overridesState };
    let count = 0;
    for (const product of products) {
      if (filterTypeId !== 'all' && product.type.id !== filterTypeId) continue;
      const basePrice = newOverrides[product.id] ?? product.currentPrice;
      if (basePrice === null || basePrice === undefined) continue;
      const newPrice = Math.round(basePrice * (1 + percentage / 100));
      newOverrides[product.id] = newPrice;
      count++;
    }
    setOverridesState(newOverrides);
    setResetKey((k) => k + 1);
    setBulkDialogOpen(false);
    toast(`Override aplicado a ${count} productos`);
  }

  async function handleSaveAndCalculate(): Promise<void> {
    setSaving(true);
    try {
      const overridesPayload = Object.entries(overridesState).map(
        ([productId, overridePrice]) => ({
          productId,
          overridePrice,
        }),
      );

      // Parallel saves (review fix: was 3 sequential, now 2 parallel + 1 sequential)
      await Promise.all([
        apiClientFetch(`/api/scenarios/${scenario.id}/overrides`, token, {
          method: 'PUT',
          body: JSON.stringify({ overrides: overridesPayload }),
          headers: { 'Content-Type': 'application/json' },
        }),
        apiClientFetch(`/api/scenarios/${scenario.id}`, token, {
          method: 'PUT',
          body: JSON.stringify({
            gatewaySlug: gatewayPlanConfig.gatewaySlug,
            paymentMethod: gatewayPlanConfig.paymentMethod,
            withdrawalDays: gatewayPlanConfig.withdrawalDays,
            installments: gatewayPlanConfig.installments,
            planId: gatewayPlanConfig.planId || undefined,
          }),
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      // Then calculate (depends on saved data)
      const calcRes = await apiClientFetch<{ data: ScenarioCalcResponse }>(
        `/api/scenarios/${scenario.id}/calculate`,
        token,
      );
      setCalcResults(calcRes.data.results);
      toast.success('Escenario guardado y calculado');
    } catch {
      toast.error('Error al guardar los overrides. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublic(): Promise<void> {
    try {
      const res = await apiClientFetch<{ data: Scenario }>(
        `/api/scenarios/${scenario.id}/toggle-public`,
        token,
        { method: 'PATCH' },
      );
      setIsPublic(res.data.isPublic);
      toast.success(
        res.data.isPublic
          ? 'Escenario compartido con inversores'
          : 'Escenario ahora es privado',
      );
    } catch {
      toast.error('Error al cambiar la visibilidad del escenario');
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Link
            href='/escenarios'
            className='text-muted-foreground text-sm hover:underline'
          >
            &larr; Volver a escenarios
          </Link>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {scenario.name}
          </h1>
        </div>
        {isOwner && (
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground text-sm'>Compartir</span>
            <Switch checked={isPublic} onCheckedChange={handleTogglePublic} />
          </div>
        )}
      </div>

      {/* Gateway/Plan Selector Card */}
      <GatewayPlanSelector
        config={config}
        value={gatewayPlanConfig}
        onChange={handleGatewayPlanChange}
      />

      {/* Actions Bar */}
      <div className='flex items-center justify-between'>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => setBulkDialogOpen(true)}>
            Ajuste masivo
          </Button>
          <Button variant='ghost' onClick={handleClearOverrides}>
            Limpiar overrides
          </Button>
        </div>
        <Button onClick={handleSaveAndCalculate} disabled={saving}>
          {saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
          Guardar y calcular
        </Button>
      </div>

      {/* Product Override Table */}
      <ProductOverrideTable
        products={products}
        overrides={overridesState}
        calcResults={calcResults}
        onOverrideChange={handleOverrideChange}
        resetKey={resetKey}
      />

      {/* Margin Summary (only shown after calculation) */}
      {calcResults && <MarginSummary results={calcResults} />}

      {/* Bulk Override Dialog */}
      <BulkOverrideDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        products={products}
        onApply={handleBulkOverride}
      />
    </div>
  );
}
