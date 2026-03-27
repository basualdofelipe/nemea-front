'use client';

import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { BomItem, Product } from './types';
import { getProductDisplayName } from './types';

interface BomRow {
  supplyId: string;
  quantity: string;
}

interface BomGroupEditorDialogProps {
  products: Product[];
  supplies: SupplyOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function serializeBom(items: { supplyId: string; quantity: string }[]): string {
  const sorted = [...items]
    .map((i) => ({ supplyId: i.supplyId, quantity: i.quantity }))
    .sort((a, b) => a.supplyId.localeCompare(b.supplyId));
  return JSON.stringify(sorted);
}

export function BomGroupEditorDialog({
  products,
  supplies,
  open,
  onOpenChange,
  onSuccess,
}: BomGroupEditorDialogProps): ReactElement {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<BomRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [divergentIds, setDivergentIds] = useState<Set<string>>(new Set());

  const fetchAllBoms = useCallback(async (): Promise<void> => {
    if (!token || products.length === 0) return;
    setIsLoading(true);

    try {
      const results = await Promise.all(
        products.map(async (p) => {
          const res = await apiClientFetch<{ data: BomItem[] }>(
            `/api/products/${p.id}/bom`,
            token,
          );
          return { productId: p.id, items: res.data };
        }),
      );

      // Find majority BOM
      const bomCounts = new Map<string, number>();
      const bomByProduct = new Map<string, string>();

      for (const { productId, items } of results) {
        const serialized = serializeBom(
          items.map((i) => ({
            supplyId: i.supply.id,
            quantity: i.quantity,
          })),
        );
        bomByProduct.set(productId, serialized);
        bomCounts.set(serialized, (bomCounts.get(serialized) ?? 0) + 1);
      }

      let majorityBom = '[]';
      let maxCount = 0;
      for (const [bom, count] of bomCounts) {
        if (count > maxCount) {
          maxCount = count;
          majorityBom = bom;
        }
      }

      // Detect divergent products
      const divergent = new Set<string>();
      for (const [productId, serialized] of bomByProduct) {
        if (serialized !== majorityBom) {
          divergent.add(productId);
        }
      }
      setDivergentIds(divergent);

      // Pre-populate rows with majority BOM
      const majorityItems = JSON.parse(majorityBom) as {
        supplyId: string;
        quantity: string;
      }[];
      setRows(
        majorityItems.map((i) => ({
          supplyId: i.supplyId,
          quantity: i.quantity,
        })),
      );

      // All checked by default
      setSelectedIds(new Set(products.map((p) => p.id)));
    } catch {
      toast.error('Error al cargar BOMs');
    } finally {
      setIsLoading(false);
    }
  }, [token, products]);

  useEffect(() => {
    if (open) {
      void fetchAllBoms();
    }
  }, [open, fetchAllBoms]);

  function toggleProduct(productId: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

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
    if (selectedIds.size === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

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
      await apiClientFetch('/api/products/batch-bom', token, {
        method: 'PUT',
        body: JSON.stringify({
          productIds: Array.from(selectedIds),
          items: validRows.map((r) => ({
            supplyId: r.supplyId,
            quantity: parseFloat(r.quantity),
          })),
        }),
      });
      toast.success(
        `BOM actualizado para ${selectedIds.size} producto${selectedIds.size > 1 ? 's' : ''}`,
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar BOM grupal',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Editar BOM grupal</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className='text-muted-foreground py-4 text-center text-sm'>
            Cargando BOMs...
          </p>
        ) : (
          <div className='space-y-4'>
            <div>
              <p className='mb-2 text-sm font-medium'>Productos</p>
              <div className='max-h-40 space-y-1 overflow-y-auto rounded-md border p-2'>
                {products.map((product) => (
                  <label
                    key={product.id}
                    className='hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded px-2 py-1'
                  >
                    <Checkbox
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                    <span className='text-sm'>
                      {getProductDisplayName(product)}
                    </span>
                    {divergentIds.has(product.id) && (
                      <AlertTriangle className='size-3 text-yellow-500' />
                    )}
                  </label>
                ))}
              </div>
              {divergentIds.size > 0 && (
                <p className='text-muted-foreground mt-1 text-xs'>
                  Los productos con advertencia tienen un BOM diferente al
                  mayoritario.
                </p>
              )}
            </div>

            <div>
              <p className='mb-2 text-sm font-medium'>Materiales</p>
              <div className='space-y-2'>
                {rows.length === 0 ? (
                  <p className='text-muted-foreground py-2 text-center text-sm'>
                    Sin materiales.
                  </p>
                ) : (
                  <>
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
                  </>
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
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={isSaving || isLoading}
          >
            {isSaving
              ? 'Guardando...'
              : `Guardar BOM (${selectedIds.size} productos)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
