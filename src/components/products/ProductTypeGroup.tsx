'use client';

import { Fragment, type ReactElement } from 'react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CatalogItem, Product } from './types';
import { formatSellingPrice } from './types';
import { ProductExpandedRow } from './ProductExpandedRow';

interface SupplyOption {
  id: string;
  name: string;
  unitType: 'm2' | 'unidad' | 'metro' | 'kg';
  isActive: boolean;
  type: { name: string };
}

interface ProductTypeGroupProps {
  typeName: string;
  products: Product[];
  supplies: SupplyOption[];
  types: CatalogItem[];
  names: CatalogItem[];
  finishes: CatalogItem[];
  colors: CatalogItem[];
  sizes: CatalogItem[];
  isAdmin: boolean;
}

export function ProductTypeGroup({
  typeName,
  products,
  supplies,
  types,
  names,
  finishes,
  colors,
  sizes,
  isAdmin,
}: ProductTypeGroupProps): ReactElement {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const colSpan = 6;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className='hover:bg-muted/50 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors'>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform duration-200 ${
            isOpen ? '' : '-rotate-90'
          }`}
        />
        <span className='font-medium'>{typeName}</span>
        <Badge variant='secondary' className='ml-1'>
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </Badge>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Terminacion</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Talle</TableHead>
                <TableHead>Precio Venta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    className='text-muted-foreground h-16 text-center'
                  >
                    No hay productos en esta categoria.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <Fragment key={product.id}>
                    <TableRow
                      className={`cursor-pointer ${
                        !product.isActive ? 'opacity-50' : ''
                      } ${expandedId === product.id ? 'bg-muted/30' : ''}`}
                      onClick={() =>
                        setExpandedId(
                          expandedId === product.id ? null : product.id,
                        )
                      }
                    >
                      <TableCell className='font-mono text-sm'>
                        {product.skuCode}
                      </TableCell>
                      <TableCell className='font-medium'>
                        {product.name.name}
                      </TableCell>
                      <TableCell>{product.finish.name}</TableCell>
                      <TableCell>{product.color.name}</TableCell>
                      <TableCell>
                        {product.size.name === 'Talle Unico'
                          ? '\u2014'
                          : product.size.name}
                      </TableCell>
                      <TableCell>
                        {formatSellingPrice(product.currentPrice)}
                      </TableCell>
                    </TableRow>
                    {expandedId === product.id && (
                      <ProductExpandedRow
                        key={`${product.id}-expanded`}
                        product={product}
                        supplies={supplies}
                        types={types}
                        names={names}
                        finishes={finishes}
                        colors={colors}
                        sizes={sizes}
                        isAdmin={isAdmin}
                        colSpan={colSpan}
                      />
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
