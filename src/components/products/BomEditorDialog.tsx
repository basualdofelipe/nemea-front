'use client';

import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { apiClientFetch } from '@/lib/api-client';
import type { SupplyOption } from '@/types/supply';
import { UNIT_LABELS } from '@/types/supply';
import { SupplyCombobox } from './SupplyCombobox';
import type { BomItem } from './types';

interface BomRow {
  supplyId: string;
  quantity: string;
}

interface BomEditorDialogProps {
  productId: string;
  productName: string;
  supplies: SupplyOption[];
  currentBom: BomItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BomEditorDialog({
  productId,
  productName,
  supplies,
  currentBom,
  open,
  onOpenChange,
  onSuccess,
}: BomEditorDialogProps): ReactElement {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [rows, setRows] = useState<BomRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const initRows = useCallback((): void => {
    if (currentBom.length > 0) {
      setRows(
        currentBom.map((item) => ({
          supplyId: item.supply.id,
          quantity: item.quantity,
        })),
      );
    } else {
      setRows([]);
    }
  }, [currentBom]);

  useEffect(() => {
    if (open) initRows();
  }, [open, initRows]);

  function addRow(): void {
    setRows((prev) => [...prev, { supplyId: '', quantity: '' }]);
  }

  function removeRow(index: number): void {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof BomRow, value: string): void {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function getUnitLabel(supplyId: string): string {
    const supply = supplies.find((s) => s.id === supplyId);
    if (!supply) return '-';
    return UNIT_LABELS[supply.unitType] ?? supply.unitType;
  }

  async function handleSave(): Promise<void> {
    const validRows = rows.filter((r) => r.supplyId && r.quantity);
    for (const row of validRows) {
      const qty = parseFloat(row.quantity);
      if (isNaN(qty) || qty <= 0) {
        toast.error('Todas las cantidades deben ser mayores a 0');
        return;
      }
    }

    setIsSaving(true);
    try {
      await apiClientFetch(`/api/products/${productId}/bom`, token, {
        method: 'PUT',
        body: JSON.stringify({
          items: validRows.map((r) => ({
            supplyId: r.supplyId,
            quantity: parseFloat(r.quantity),
          })),
        }),
      });
      toast.success('BOM actualizado');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar BOM',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Editar BOM - {productName}</DialogTitle>
        </DialogHeader>

        <div className='space-y-2'>
          {rows.length === 0 ? (
            <p className='text-muted-foreground py-4 text-center text-sm'>
              Sin materiales. Agrega uno para comenzar.
            </p>
          ) : (
            <div className='space-y-2'>
              <div className='text-muted-foreground grid grid-cols-[1fr_100px_60px_40px] gap-2 text-xs font-medium'>
                <span>Insumo</span>
                <span>Cantidad</span>
                <span>Unidad</span>
                <span />
              </div>
              {rows.map((row, index) => (
                <div
                  key={index}
                  className='grid grid-cols-[1fr_100px_60px_40px] items-center gap-2'
                >
                  <SupplyCombobox
                    supplies={supplies.filter((s) => s.isActive)}
                    value={row.supplyId}
                    onChange={(id) => updateRow(index, 'supplyId', id)}
                  />
                  <Input
                    type='number'
                    step='0.01'
                    min='0'
                    placeholder='0'
                    value={row.quantity}
                    onChange={(e) =>
                      updateRow(index, 'quantity', e.target.value)
                    }
                    className='h-8'
                  />
                  <span className='text-muted-foreground text-sm'>
                    {getUnitLabel(row.supplyId)}
                  </span>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-8'
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 className='size-3' />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            variant='outline'
            size='sm'
            onClick={addRow}
            className='w-full'
          >
            <Plus className='mr-1 size-3' />
            Agregar material
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar BOM'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
