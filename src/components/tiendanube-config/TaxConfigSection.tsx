'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClientFetch } from '@/lib/api-client';
import type { TnTaxConfig } from './types';

interface TaxConfigSectionProps {
  taxConfig: TnTaxConfig;
}

export function TaxConfigSection({
  taxConfig,
}: TaxConfigSectionProps): ReactElement {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [ivaValue, setIvaValue] = useState(taxConfig.ivaRate.toFixed(2));
  const [iibbValue, setIibbValue] = useState(taxConfig.iibbRate.toFixed(2));
  const [saving, setSaving] = useState(false);

  async function handleSave(): Promise<void> {
    const ivaRate = parseFloat(ivaValue);
    const iibbRate = parseFloat(iibbValue);

    if (isNaN(ivaRate) || ivaRate < 0 || ivaRate > 100) {
      toast.error('IVA debe ser un numero entre 0 y 100');
      return;
    }
    if (isNaN(iibbRate) || iibbRate < 0 || iibbRate > 100) {
      toast.error('IIBB debe ser un numero entre 0 y 100');
      return;
    }

    setSaving(true);
    try {
      await apiClientFetch('/api/tiendanube-config/taxes', token, {
        method: 'PUT',
        body: JSON.stringify({ ivaRate, iibbRate }),
      });
      toast.success('Impuestos actualizados');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar impuestos',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='iva-rate'>IVA (%)</Label>
          <Input
            id='iva-rate'
            type='number'
            step='0.01'
            min='0'
            max='100'
            value={ivaValue}
            onChange={(e) => setIvaValue(e.target.value)}
            className='w-32'
            disabled={saving}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='iibb-rate'>IIBB / SIRTAC (%)</Label>
          <Input
            id='iibb-rate'
            type='number'
            step='0.01'
            min='0'
            max='100'
            value={iibbValue}
            onChange={(e) => setIibbValue(e.target.value)}
            className='w-32'
            disabled={saving}
          />
          <p className='text-muted-foreground text-xs'>
            Alicuota IIBB segun regimen SIRTAC/COMARB. Consultar con contador.
          </p>
        </div>
      </div>

      <Button onClick={() => void handleSave()} disabled={saving}>
        {saving && <Loader2 className='mr-2 size-4 animate-spin' />}
        Guardar
      </Button>
    </div>
  );
}
