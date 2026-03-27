'use client';

import { Fragment, type ReactElement } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ChevronDown,
  ClipboardList,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CatalogItem, Product } from './types';
import { formatCost, formatMargin, formatSellingPrice } from './types';
import { BatchPriceDialog } from './BatchPriceDialog';
import { BomGroupEditorDialog } from './BomGroupEditorDialog';
import { ProductExpandedRow } from './ProductExpandedRow';
import type { SupplyOption } from '@/types/supply';

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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGroupBomEditor, setShowGroupBomEditor] = useState(false);
  const [showBatchPrice, setShowBatchPrice] = useState(false);

  const colSpan = 8;

  const avgCost = useMemo((): number | null => {
    const withCost = products.filter((p) => p.cost !== null);
    if (withCost.length === 0) return null;
    const total = withCost.reduce((sum, p) => sum + (p.cost as number), 0);
    return total / withCost.length;
  }, [products]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div
          role='button'
          tabIndex={0}
          className='hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left transition-colors'
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
        >
          <ChevronDown
            className={`size-4 shrink-0 transition-transform duration-200 ${
              isOpen ? '' : '-rotate-90'
            }`}
          />
          <span className='font-medium'>{typeName}</span>
          <Badge variant='secondary' className='ml-1'>
            {products.length} {products.length === 1 ? 'producto' : 'productos'}
          </Badge>
          {avgCost !== null && (
            <Badge variant='outline' className='ml-1'>
              Costo prom: {formatCost(avgCost)}
            </Badge>
          )}
          {isAdmin && (
            <div
              className='ml-auto flex items-center gap-1'
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size='sm'
                variant='ghost'
                className='h-7 text-xs'
                onClick={() => setShowGroupBomEditor(true)}
              >
                <ClipboardList className='mr-1 size-3' />
                Editar BOM grupal
              </Button>
              <Button
                size='sm'
                variant='ghost'
                className='h-7 text-xs'
                onClick={() => setShowBatchPrice(true)}
              >
                <DollarSign className='mr-1 size-3' />
                Precio grupal
              </Button>
            </div>
          )}
        </div>
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
                <TableHead>Costo</TableHead>
                <TableHead>Precio Venta</TableHead>
                <TableHead>Margen</TableHead>
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
                        <Link
                          href={`/productos/${product.id}`}
                          className='text-primary hover:underline'
                          onClick={(e) => e.stopPropagation()}
                        >
                          {product.name.name}
                        </Link>
                      </TableCell>
                      <TableCell>{product.finish.name}</TableCell>
                      <TableCell>{product.color.name}</TableCell>
                      <TableCell>
                        {product.size.name === 'Talle Unico'
                          ? '\u2014'
                          : product.size.name}
                      </TableCell>
                      <TableCell>
                        {product.cost === null &&
                        product.costWarnings.length === 0 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>{formatCost(product.cost)}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                Sin materiales definidos
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className='flex items-center gap-1'>
                            {formatCost(product.cost)}
                            {product.costWarnings.length > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertTriangle className='size-3.5 text-amber-500' />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {product.costWarnings.map((w, i) => (
                                      <p key={i}>{w}</p>
                                    ))}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatSellingPrice(product.currentPrice)}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const margin = formatMargin(
                            product.cost,
                            product.currentPrice,
                          );
                          return (
                            <span>
                              {margin.amount}
                              {margin.percent !== '\u2014' && (
                                <span className='text-muted-foreground ml-1 text-xs'>
                                  ({margin.percent})
                                </span>
                              )}
                            </span>
                          );
                        })()}
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

      <BomGroupEditorDialog
        products={products}
        supplies={supplies}
        open={showGroupBomEditor}
        onOpenChange={setShowGroupBomEditor}
        onSuccess={() => router.refresh()}
      />

      <BatchPriceDialog
        products={products}
        open={showBatchPrice}
        onOpenChange={setShowBatchPrice}
        onSuccess={() => router.refresh()}
      />
    </Collapsible>
  );
}
