'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
import type { TnInstallmentRate } from './types';

interface InstallmentsSectionProps {
  installments: TnInstallmentRate[];
}

export function InstallmentsSection({
  installments,
}: InstallmentsSectionProps): ReactElement {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [rateValues, setRateValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const inst of installments) {
      initial[inst.id] = inst.ratePercent.toFixed(2);
    }
    return initial;
  });

  const [savingId, setSavingId] = useState<string | null>(null);

  function handleRateChange(id: string, value: string): void {
    setRateValues((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSave(inst: TnInstallmentRate): Promise<void> {
    const value = rateValues[inst.id];
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast.error('La tasa debe ser un numero entre 0 y 100');
      return;
    }

    setSavingId(inst.id);
    try {
      await apiClientFetch(
        `/api/tiendanube-config/installment-rates/${inst.installments}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({ ratePercent: parsed }),
        },
      );
      toast.success(`Tasa de ${inst.installments} cuotas actualizada`);
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
            <TableHead>Cuotas</TableHead>
            <TableHead>Tasa (%)</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className='text-muted-foreground h-16 text-center'
              >
                No hay tasas de cuotas configuradas.
              </TableCell>
            </TableRow>
          ) : (
            installments.map((inst) => (
              <TableRow key={inst.id}>
                <TableCell className='font-medium'>
                  {inst.installments === 1
                    ? '1 cuota (contado)'
                    : `${inst.installments} cuotas`}
                </TableCell>
                <TableCell>
                  <Input
                    type='number'
                    step='0.01'
                    min='0'
                    max='100'
                    value={rateValues[inst.id] ?? ''}
                    onChange={(e) => handleRateChange(inst.id, e.target.value)}
                    className='w-24'
                    disabled={savingId === inst.id}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size='sm'
                    onClick={() => void handleSave(inst)}
                    disabled={savingId === inst.id}
                  >
                    {savingId === inst.id && (
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
