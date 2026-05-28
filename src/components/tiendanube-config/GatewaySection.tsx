'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiClientFetch } from '@/lib/api-client';
import type { TnPaymentGateway, TnGatewayRate, TnPlan } from './types';
import { PAYMENT_METHOD_LABELS } from './types';

interface GatewaySectionProps {
  gateway: TnPaymentGateway;
  rates: TnGatewayRate[];
  selectedPlan: TnPlan;
}

interface GatewayHeaderProps {
  gateway: TnPaymentGateway;
  selectedPlan: TnPlan;
}

function GatewayHeader({
  gateway,
  selectedPlan,
}: GatewayHeaderProps): ReactElement {
  return (
    <span className='flex items-center gap-2'>
      {gateway.label}
      {!gateway.isActive && (
        <Badge variant='secondary' className='text-xs'>
          Pendiente
        </Badge>
      )}
      <span className='text-muted-foreground text-xs font-normal'>
        CPT: {selectedPlan.cptPagoNube.toFixed(2)}% (Pago Nube) /{' '}
        {selectedPlan.cptOtherGateways.toFixed(2)}% (otros)
      </span>
    </span>
  );
}

function GatewaySectionContent({
  gateway,
  rates,
}: GatewaySectionProps): ReactElement {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [rateValues, setRateValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const rate of rates) {
      initial[rate.id] = rate.ratePercent.toFixed(2);
    }
    return initial;
  });

  const [savingId, setSavingId] = useState<string | null>(null);

  function handleRateChange(rateId: string, value: string): void {
    setRateValues((prev) => ({ ...prev, [rateId]: value }));
  }

  async function handleSave(rate: TnGatewayRate): Promise<void> {
    const value = rateValues[rate.id];
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error('La tasa debe ser un numero entre 0 y 100');
      return;
    }

    setSavingId(rate.id);
    try {
      await apiClientFetch(
        `/api/tiendanube-config/gateway-rates/${gateway.id}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            paymentMethod: rate.paymentMethod,
            withdrawalDays: rate.withdrawalDays,
            ratePercent: parsed,
          }),
        },
      );
      toast.success('Tasa actualizada');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar tasa',
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medio de pago</TableHead>
            <TableHead>Tiempo de retiro</TableHead>
            <TableHead>Tasa (%)</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className='text-muted-foreground h-16 text-center'
              >
                No hay tasas configuradas para esta pasarela.
              </TableCell>
            </TableRow>
          ) : (
            rates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell className='font-semibold'>
                  {PAYMENT_METHOD_LABELS[rate.paymentMethod] ??
                    rate.paymentMethod}
                </TableCell>
                <TableCell>{rate.withdrawalDays}d</TableCell>
                <TableCell>
                  <Input
                    type='number'
                    step='0.01'
                    min='0'
                    max='100'
                    value={rateValues[rate.id] ?? ''}
                    onChange={(e) => handleRateChange(rate.id, e.target.value)}
                    className='w-24'
                    disabled={savingId === rate.id}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size='sm'
                    onClick={() => void handleSave(rate)}
                    disabled={savingId === rate.id}
                  >
                    {savingId === rate.id && (
                      <Loader2 className='mr-1 size-3 animate-spin' />
                    )}
                    Guardar
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export const GatewaySection = Object.assign(GatewaySectionContent, {
  Header: GatewayHeader,
});
