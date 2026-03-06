'use client';

import type { ReactElement } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { CatalogItem, Product } from './types';

interface SupplyOption {
  id: string;
  name: string;
  unitType: 'm2' | 'unidad' | 'metro' | 'kg';
  isActive: boolean;
  type: { name: string };
}

interface ProductExpandedRowProps {
  product: Product;
  supplies: SupplyOption[];
  types: CatalogItem[];
  names: CatalogItem[];
  finishes: CatalogItem[];
  colors: CatalogItem[];
  sizes: CatalogItem[];
  isAdmin: boolean;
  colSpan: number;
}

export function ProductExpandedRow({
  colSpan,
}: ProductExpandedRowProps): ReactElement {
  return (
    <TableRow className='bg-muted/30 hover:bg-muted/30'>
      <TableCell colSpan={colSpan} className='px-8 py-4'>
        <p className='text-muted-foreground text-sm'>Cargando detalles...</p>
      </TableCell>
    </TableRow>
  );
}
