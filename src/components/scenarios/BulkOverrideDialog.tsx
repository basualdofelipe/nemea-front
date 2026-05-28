'use client';

import type { ReactElement } from 'react';
import { useState, useMemo } from 'react';
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
import type { Product } from '@/components/products/types';

interface BulkOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onApply: (filterTypeId: string | 'all', percentage: number) => void;
}

export function BulkOverrideDialog({
  open,
  onOpenChange,
  products,
  onApply,
}: BulkOverrideDialogProps): ReactElement {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [percentage, setPercentage] = useState<string>('');

  // Dedupe product types
  const productTypes = useMemo(() => {
    const seen = new Map<string, string>();
    for (const product of products) {
      if (!seen.has(product.type.id)) {
        seen.set(product.type.id, product.type.name);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const pct = parseFloat(percentage) || 0;
  const affectedCount =
    selectedType === 'all'
      ? products.length
      : products.filter((p) => p.type.id === selectedType).length;
  const typeName =
    selectedType === 'all'
      ? 'productos'
      : (productTypes.find((t) => t.id === selectedType)?.name ?? 'productos');

  function handleApply(): void {
    const parsed = parseFloat(percentage);
    if (isNaN(parsed) || parsed === 0) return;
    onApply(selectedType, parsed);
    setPercentage('');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Ajuste masivo de precios</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label>Tipo de producto</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder='Selecciona tipo' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los productos</SelectItem>
                {productTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1.5'>
            <Label>Porcentaje de ajuste</Label>
            <Input
              type='number'
              step='1'
              placeholder='Ej: 10 para +10%, -15 para -15%'
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
            />
          </div>
          {pct !== 0 && (
            <p className='text-muted-foreground text-sm'>
              Aplicar {pct >= 0 ? '+' : ''}
              {pct}% a {affectedCount} {typeName}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleApply}
            disabled={
              isNaN(parseFloat(percentage)) || parseFloat(percentage) === 0
            }
          >
            Aplicar ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
