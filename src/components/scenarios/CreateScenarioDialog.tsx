'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClientFetch } from '@/lib/api-client';
import type { TiendanubeConfigAll } from '@/components/tiendanube-config/types';
import type { Scenario } from './types';

interface CreateScenarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (scenario: Scenario) => void;
  config: TiendanubeConfigAll;
}

const NONE_VALUE = '__none__';

export function CreateScenarioDialog({
  open,
  onOpenChange,
  onCreated,
  config,
}: CreateScenarioDialogProps): ReactElement {
  const { data: session } = useSession();
  const [name, setName] = useState<string>('');
  const [gatewaySlug, setGatewaySlug] = useState<string>(NONE_VALUE);
  const [planId, setPlanId] = useState<string>(NONE_VALUE);
  const [loading, setLoading] = useState<boolean>(false);

  const activeGateways = config.gateways.filter((g) => g.isActive);

  async function handleSubmit(): Promise<void> {
    if (!name.trim()) return;
    if (!session?.accessToken) return;

    setLoading(true);
    try {
      const body: Record<string, unknown> = { name: name.trim() };
      if (gatewaySlug !== NONE_VALUE) body.gatewaySlug = gatewaySlug;
      if (planId !== NONE_VALUE) body.planId = planId;

      const res = await apiClientFetch<{ data: Scenario }>(
        '/api/scenarios',
        session.accessToken,
        {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      toast.success('Escenario creado');
      setName('');
      setGatewaySlug(NONE_VALUE);
      setPlanId(NONE_VALUE);
      onCreated(res.data);
      onOpenChange(false);
    } catch {
      toast.error('Error al crear el escenario. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Nuevo escenario</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='scenario-name'>Nombre del escenario</Label>
            <Input
              id='scenario-name'
              placeholder='Ej: Aumento Enero 2027'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Pasarela (opcional)</Label>
            <Select value={gatewaySlug} onValueChange={setGatewaySlug}>
              <SelectTrigger>
                <SelectValue placeholder='Sin seleccionar' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Sin seleccionar</SelectItem>
                {activeGateways.map((gw) => (
                  <SelectItem key={gw.slug} value={gw.slug}>
                    {gw.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1.5'>
            <Label>Plan Tiendanube (opcional)</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger>
                <SelectValue placeholder='Sin seleccionar' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Sin seleccionar</SelectItem>
                {config.plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Crear escenario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
