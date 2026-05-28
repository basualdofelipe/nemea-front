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
import type { TnPlan } from './types';

interface PlansSectionProps {
  plans: TnPlan[];
  onPlanUpdated: (updatedPlan: TnPlan) => void;
}

interface PlanFormValues {
  cptPagoNube: string;
  cptOtherGateways: string;
}

export function PlansSection({
  plans,
  onPlanUpdated,
}: PlansSectionProps): ReactElement {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [formValues, setFormValues] = useState<Record<string, PlanFormValues>>(
    () => {
      const initial: Record<string, PlanFormValues> = {};
      for (const plan of plans) {
        initial[plan.id] = {
          cptPagoNube: plan.cptPagoNube.toFixed(2),
          cptOtherGateways: plan.cptOtherGateways.toFixed(2),
        };
      }
      return initial;
    },
  );

  const [savingId, setSavingId] = useState<string | null>(null);

  function handleChange(
    planId: string,
    field: keyof PlanFormValues,
    value: string,
  ): void {
    setFormValues((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }));
  }

  async function handleSave(plan: TnPlan): Promise<void> {
    const values = formValues[plan.id];
    const cptPagoNube = parseFloat(values.cptPagoNube);
    const cptOtherGateways = parseFloat(values.cptOtherGateways);

    if (isNaN(cptPagoNube) || cptPagoNube < 0 || cptPagoNube > 100) {
      toast.error('CPT Pago Nube debe ser un numero entre 0 y 100');
      return;
    }
    if (
      isNaN(cptOtherGateways) ||
      cptOtherGateways < 0 ||
      cptOtherGateways > 100
    ) {
      toast.error('CPT Otros debe ser un numero entre 0 y 100');
      return;
    }

    setSavingId(plan.id);
    try {
      await apiClientFetch(`/api/tiendanube-config/plans/${plan.id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ cptPagoNube, cptOtherGateways }),
      });

      const updatedPlan: TnPlan = {
        ...plan,
        cptPagoNube,
        cptOtherGateways,
      };
      onPlanUpdated(updatedPlan);
      toast.success(`Plan ${plan.label} actualizado`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar plan',
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
            <TableHead>Plan</TableHead>
            <TableHead>Solo Pago Nube</TableHead>
            <TableHead>CPT Pago Nube (%)</TableHead>
            <TableHead>CPT Otros (%)</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className='font-semibold'>{plan.label}</TableCell>
              <TableCell>
                <Badge variant={plan.onlyPagoNube ? 'default' : 'secondary'}>
                  {plan.onlyPagoNube ? 'Si' : 'No'}
                </Badge>
              </TableCell>
              <TableCell>
                <Input
                  type='number'
                  step='0.01'
                  min='0'
                  max='100'
                  value={formValues[plan.id]?.cptPagoNube ?? ''}
                  onChange={(e) =>
                    handleChange(plan.id, 'cptPagoNube', e.target.value)
                  }
                  className='w-24'
                  disabled={savingId === plan.id}
                />
              </TableCell>
              <TableCell>
                <Input
                  type='number'
                  step='0.01'
                  min='0'
                  max='100'
                  value={formValues[plan.id]?.cptOtherGateways ?? ''}
                  onChange={(e) =>
                    handleChange(plan.id, 'cptOtherGateways', e.target.value)
                  }
                  className='w-24'
                  disabled={savingId === plan.id || plan.onlyPagoNube}
                />
              </TableCell>
              <TableCell>
                <Button
                  size='sm'
                  onClick={() => void handleSave(plan)}
                  disabled={savingId === plan.id}
                >
                  {savingId === plan.id && (
                    <Loader2 className='mr-1 size-3 animate-spin' />
                  )}
                  Guardar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
