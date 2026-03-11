'use client';

import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
import type { Product } from './types';
import { formatSellingPrice, getProductDisplayName } from './types';

interface BatchPriceDialogProps {
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BatchPriceDialog({
  products,
  open,
  onOpenChange,
  onSuccess,
}: BatchPriceDialogProps): ReactElement {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(products.map((p) => p.id)));
      setPrice('');
    }
  }, [open, products]);

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

  async function handleSave(): Promise<void> {
    if (selectedIds.size === 0) {
      toast.error('Selecciona al menos un producto');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error('Ingresa un precio valido');
      return;
    }

    setIsSaving(true);
    try {
      await apiClientFetch('/api/products/batch-prices', token, {
        method: 'POST',
        body: JSON.stringify({
          productIds: Array.from(selectedIds),
          price: numPrice,
        }),
      });
      toast.success(
        `Precio actualizado para ${selectedIds.size} producto${selectedIds.size > 1 ? 's' : ''}`,
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al actualizar precios',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Precio de venta grupal</DialogTitle>
        </DialogHeader>

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
                  <span className='flex-1 text-sm'>
                    {getProductDisplayName(product)}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {formatSellingPrice(product.currentPrice)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className='mb-2 text-sm font-medium'>Nuevo precio de venta</p>
            <Input
              type='number'
              step='0.01'
              min='0'
              placeholder='Precio'
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className='w-40'
            />
          </div>
        </div>

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
            disabled={isSaving || !price}
          >
            {isSaving
              ? 'Guardando...'
              : `Actualizar (${selectedIds.size} productos)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
