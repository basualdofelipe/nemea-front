'use client';

import type { ReactElement } from 'react';
import { Separator } from '@/components/ui/separator';
import type { CalcResult, CalcInverseResult } from './types';

type CalcMode = 'forward' | 'inverse';

interface DesglosePanelProps {
  result: CalcResult | CalcInverseResult;
  mode: CalcMode;
  installments: number;
}

const arsFormat = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
});

function formatArs(value: number): string {
  return arsFormat.format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

interface LineItemProps {
  label: string;
  value: string;
  variant?:
    | 'negative'
    | 'positive'
    | 'neutral'
    | 'highlight-green'
    | 'highlight-blue';
  bold?: boolean;
  indent?: boolean;
  large?: boolean;
}

function LineItem({
  label,
  value,
  variant = 'neutral',
  bold = false,
  indent = false,
  large = false,
}: LineItemProps): ReactElement {
  const colorClass =
    variant === 'negative'
      ? 'text-red-600 dark:text-red-400'
      : variant === 'positive'
        ? 'text-green-600 dark:text-green-400'
        : variant === 'highlight-green'
          ? 'text-green-700 dark:text-green-300'
          : variant === 'highlight-blue'
            ? 'text-blue-700 dark:text-blue-300'
            : 'text-foreground';

  return (
    <div
      className={`flex items-center justify-between py-1 ${indent ? 'pl-4' : ''} ${large ? 'py-2' : ''}`}
    >
      <span
        className={`text-sm ${bold ? 'font-semibold' : ''} ${large ? 'text-base' : ''} text-muted-foreground`}
      >
        {label}
      </span>
      <span
        className={`text-sm ${bold ? 'font-semibold' : ''} ${large ? 'text-lg font-bold' : ''} ${colorClass} tabular-nums`}
      >
        {value}
      </span>
    </div>
  );
}

export function DesglosePanel({
  result,
  mode,
  installments,
}: DesglosePanelProps): ReactElement {
  const isInverse = mode === 'inverse';
  const inverseResult = isInverse ? (result as CalcInverseResult) : null;

  return (
    <div className='space-y-1'>
      {/* Inverse mode: show required selling price at top */}
      {isInverse && inverseResult && (
        <div className='mb-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30'>
          <LineItem
            label='Precio de venta necesario'
            value={formatArs(inverseResult.precioVenta)}
            variant='highlight-blue'
            bold
            large
          />
        </div>
      )}

      {/* Total paid by client */}
      <LineItem
        label='Total pagado por cliente'
        value={formatArs(result.totalCliente)}
        bold
      />

      <Separator className='my-2' />

      {/* Deductions */}
      <LineItem
        label={`Comision pasarela (${formatPercent(result.tasaBase)} + IVA = ${formatPercent(result.tasaConIVA)})`}
        value={`-${formatArs(result.comisionPasarela)}`}
        variant='negative'
      />

      {installments > 1 && (
        <LineItem
          label={`Financiacion cuotas (${formatPercent(result.tasaCuotas)})`}
          value={`-${formatArs(result.costoFinanciacion)}`}
          variant='negative'
        />
      )}

      <LineItem
        label='CPT Tiendanube'
        value={`-${formatArs(result.cpt)}`}
        variant='negative'
      />

      <LineItem
        label='Retenciones IIBB'
        value={`-${formatArs(result.retencionIIBB)}`}
        variant='negative'
      />

      <LineItem
        label='Neto recibido'
        value={formatArs(result.netoRecibido)}
        bold
      />

      <Separator className='my-2' />

      {/* IVA breakdown */}
      <LineItem
        label='IVA debito fiscal'
        value={`-${formatArs(result.ivaDebito)}`}
        variant='negative'
      />
      <LineItem
        label='IVA credito producto'
        value={`+${formatArs(result.ivaCreditoProducto)}`}
        variant='positive'
        indent
      />
      <LineItem
        label='IVA credito comision'
        value={`+${formatArs(result.ivaCreditoComision)}`}
        variant='positive'
        indent
      />
      <LineItem
        label='IVA neto a pagar'
        value={`-${formatArs(result.ivaNeto)}`}
        variant='negative'
      />

      {/* Product cost */}
      <LineItem
        label='Costo producto + IVA'
        value={`-${formatArs(result.costoProductoConIVA)}`}
        variant='negative'
      />

      <Separator className='my-2' />

      {/* Ganancia real -- highlighted green, large */}
      <div className='rounded-lg bg-green-50 p-3 dark:bg-green-950/30'>
        <LineItem
          label={`GANANCIA REAL (margen ${formatPercent(result.margen)})`}
          value={formatArs(result.gananciaReal)}
          variant='highlight-green'
          bold
          large
        />
      </div>

      {/* Disclaimer */}
      <p className='text-muted-foreground pt-3 text-xs'>
        Valores aproximados sujetos a variaciones de tasas y redondeos de la
        pasarela de pago.
      </p>
    </div>
  );
}
