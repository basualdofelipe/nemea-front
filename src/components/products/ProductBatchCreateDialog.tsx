'use client';

import type { ReactElement } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CatalogItem } from './types';

interface ProductBatchCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  types: CatalogItem[];
  names: CatalogItem[];
  finishes: CatalogItem[];
  colors: CatalogItem[];
  sizes: CatalogItem[];
}

export function ProductBatchCreateDialog({
  open,
  onOpenChange,
}: ProductBatchCreateDialogProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear productos</DialogTitle>
        </DialogHeader>
        <p className='text-muted-foreground text-sm'>Placeholder</p>
      </DialogContent>
    </Dialog>
  );
}
