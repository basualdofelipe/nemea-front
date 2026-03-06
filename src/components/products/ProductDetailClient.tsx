'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  DollarSign,
  History,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
import { apiClientFetch } from '@/lib/api-client';
import type { BomItem, CatalogItem, CostBreakdownItem, Product } from './types';
import {
  formatCost,
  formatMargin,
  formatSellingPrice,
  getProductDisplayName,
} from './types';
import { AddSellingPriceInline } from './AddSellingPriceInline';
import { BomEditorDialog } from './BomEditorDialog';
import { PriceHistoryDialog } from './PriceHistoryDialog';
import { ProductEditDialog } from './ProductEditDialog';

const UNIT_LABELS: Record<string, string> = {
  m2: 'm\u00B2',
  unidad: 'un.',
  metro: 'm',
  kg: 'kg',
};

interface SupplyOption {
  id: string;
  name: string;
  unitType: 'm2' | 'unidad' | 'metro' | 'kg';
  isActive: boolean;
  type: { name: string };
}

interface ProductDetailClientProps {
  product: Product & { costBreakdown: CostBreakdownItem[] | null };
  bomItems: BomItem[];
  types: CatalogItem[];
  names: CatalogItem[];
  finishes: CatalogItem[];
  colors: CatalogItem[];
  sizes: CatalogItem[];
  supplies: SupplyOption[];
  isAdmin: boolean;
}

export function ProductDetailClient({
  product,
  bomItems,
  types,
  names,
  finishes,
  colors,
  sizes,
  supplies,
  isAdmin,
}: ProductDetailClientProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBomEditor, setShowBomEditor] = useState(false);
  const [showPriceInline, setShowPriceInline] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const costBreakdown = product.costBreakdown ?? [];
  const costMap = new Map(costBreakdown.map((cb) => [cb.supplyId, cb]));
  const totalCost = costBreakdown.reduce(
    (sum, cb) => sum + (cb.lineCost ?? 0),
    0,
  );
  const margin = formatMargin(product.cost, product.currentPrice);

  async function handleToggleStatus(): Promise<void> {
    setIsToggling(true);
    try {
      await apiClientFetch(`/api/products/${product.id}/toggle-status`, token, {
        method: 'PATCH',
      });
      toast.success(
        `Producto ${product.isActive ? 'desactivado' : 'activado'}`,
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al cambiar estado',
      );
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <div className='space-y-6'>
      {/* Back link */}
      <Link
        href='/productos'
        className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors'
      >
        <ArrowLeft className='size-4' />
        Volver a productos
      </Link>

      {/* Header */}
      <div className='space-y-1'>
        <div className='flex items-center gap-3'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {getProductDisplayName(product)}
          </h1>
          <Badge variant={product.isActive ? 'default' : 'destructive'}>
            {product.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <p className='text-muted-foreground font-mono text-sm'>
          {product.skuCode}
        </p>
      </div>

      {/* BOM + Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Materiales (BOM)</CardTitle>
          <CardDescription>Desglose de costos por material</CardDescription>
        </CardHeader>
        <CardContent>
          {bomItems.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              Sin materiales definidos
            </p>
          ) : (
            <div className='space-y-4'>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Precio Unit.</TableHead>
                      <TableHead>Costo Linea</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bomItems.map((item) => {
                      const cb = costMap.get(item.supply.id);
                      return (
                        <TableRow
                          key={item.id}
                          className={!item.supply.isActive ? 'opacity-50' : ''}
                        >
                          <TableCell className='flex items-center gap-1'>
                            {item.supply.name}
                            {!item.supply.isActive && (
                              <AlertTriangle className='text-destructive size-3' />
                            )}
                          </TableCell>
                          <TableCell>{item.supply.type.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {UNIT_LABELS[item.supply.unitType] ??
                              item.supply.unitType}
                          </TableCell>
                          <TableCell>
                            {cb?.unitPrice != null ? (
                              formatCost(cb.unitPrice)
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className='flex items-center gap-1'>
                                      {'\u2014'}
                                      <AlertTriangle className='size-3 text-amber-500' />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Sin precio registrado
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          <TableCell>
                            {cb?.lineCost != null
                              ? formatCost(cb.lineCost)
                              : '\u2014'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {bomItems.length > 0 && (
                      <TableRow className='font-medium'>
                        <TableCell colSpan={5} className='text-right'>
                          Total
                        </TableCell>
                        <TableCell>
                          {formatCost(totalCost > 0 ? totalCost : product.cost)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Margin Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de margen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 sm:grid-cols-3'>
            <div>
              <p className='text-muted-foreground text-xs font-medium uppercase'>
                Costo total
              </p>
              <p className='text-lg font-semibold'>
                {product.cost !== null
                  ? formatCost(product.cost)
                  : 'Sin materiales definidos'}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs font-medium uppercase'>
                Precio de venta
              </p>
              <p className='text-lg font-semibold'>
                {product.currentPrice !== null
                  ? formatSellingPrice(product.currentPrice)
                  : 'Sin precio definido'}
              </p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs font-medium uppercase'>
                Margen
              </p>
              <p className='text-lg font-semibold'>
                {margin.amount}
                {margin.percent !== '\u2014' && (
                  <span className='text-muted-foreground ml-2 text-sm font-normal'>
                    ({margin.percent})
                  </span>
                )}
              </p>
            </div>
          </div>

          {product.costWarnings.length > 0 && (
            <div className='mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950'>
              <div className='flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200'>
                <AlertTriangle className='size-4' />
                Advertencias
              </div>
              <ul className='mt-1 list-inside list-disc text-sm text-amber-700 dark:text-amber-300'>
                {product.costWarnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setShowEditDialog(true)}
              >
                <Pencil className='mr-1 size-3' />
                Editar producto
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setShowBomEditor(true)}
              >
                <ClipboardList className='mr-1 size-3' />
                Editar BOM
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setShowPriceInline((prev) => !prev)}
              >
                <DollarSign className='mr-1 size-3' />
                Agregar precio
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setShowPriceHistory(true)}
              >
                <History className='mr-1 size-3' />
                Historial precios
              </Button>
              <div className='ml-auto flex items-center gap-2'>
                <Badge variant={product.isActive ? 'default' : 'destructive'}>
                  {product.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
                <Switch
                  checked={product.isActive}
                  onCheckedChange={() => void handleToggleStatus()}
                  disabled={isToggling}
                />
              </div>
            </div>

            {showPriceInline && (
              <div className='mt-3'>
                <AddSellingPriceInline
                  productId={product.id}
                  onClose={() => setShowPriceInline(false)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ProductEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        product={product}
        types={types}
        names={names}
        finishes={finishes}
        colors={colors}
        sizes={sizes}
      />

      <BomEditorDialog
        productId={product.id}
        productName={getProductDisplayName(product)}
        supplies={supplies}
        currentBom={bomItems}
        open={showBomEditor}
        onOpenChange={setShowBomEditor}
        onSuccess={() => router.refresh()}
      />

      <PriceHistoryDialog
        productId={product.id}
        productName={getProductDisplayName(product)}
        open={showPriceHistory}
        onOpenChange={setShowPriceHistory}
      />
    </div>
  );
}
