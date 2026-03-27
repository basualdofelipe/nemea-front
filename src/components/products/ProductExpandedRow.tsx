'use client';

import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle,
  ClipboardList,
  DollarSign,
  History,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
} from '@/components/ui/table';
import { apiClientFetch } from '@/lib/api-client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { BomItem, CatalogItem, CostBreakdownItem, Product } from './types';
import {
  formatCost,
  formatMargin,
  formatSellingPrice,
  getProductDisplayName,
} from './types';
import type { SupplyOption } from '@/types/supply';
import { UNIT_LABELS } from '@/types/supply';
import { formatDate } from '@/lib/formatters';
import { AddSellingPriceInline } from './AddSellingPriceInline';
import { BomEditorDialog } from './BomEditorDialog';
import { PriceHistoryDialog } from './PriceHistoryDialog';
import { ProductEditDialog } from './ProductEditDialog';

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
  product,
  supplies,
  types,
  names,
  finishes,
  colors,
  sizes,
  isAdmin,
  colSpan,
}: ProductExpandedRowProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownItem[]>([]);
  const [bomLoading, setBomLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBomEditor, setShowBomEditor] = useState(false);
  const [showPriceInline, setShowPriceInline] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const fetchBom = useCallback(async (): Promise<void> => {
    if (!token) return;
    setBomLoading(true);
    try {
      const [bomRes, productRes] = await Promise.all([
        apiClientFetch<{ data: BomItem[] }>(
          `/api/products/${product.id}/bom`,
          token,
        ),
        apiClientFetch<{
          data: Product & { costBreakdown: CostBreakdownItem[] | null };
        }>(`/api/products/${product.id}`, token),
      ]);
      setBomItems(bomRes.data);
      setCostBreakdown(productRes.data.costBreakdown ?? []);
    } catch {
      toast.error('Error al cargar materiales');
    } finally {
      setBomLoading(false);
    }
  }, [product.id, token]);

  useEffect(() => {
    void fetchBom();
  }, [fetchBom]);

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
    <>
      <TableRow className='bg-muted/30 hover:bg-muted/30'>
        <TableCell colSpan={colSpan} className='px-8 py-4'>
          <div className='space-y-3'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <p className='text-muted-foreground text-xs font-medium uppercase'>
                  Producto
                </p>
                <p className='text-sm font-medium'>
                  {getProductDisplayName(product)}
                </p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs font-medium uppercase'>
                  SKU
                </p>
                <p className='font-mono text-sm'>{product.skuCode}</p>
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <p className='text-muted-foreground text-xs font-medium uppercase'>
                  Precio de venta
                </p>
                <p className='text-sm font-medium'>
                  {formatSellingPrice(product.currentPrice)}
                </p>
              </div>
              {product.lastPriceUpdate && (
                <div>
                  <p className='text-muted-foreground text-xs font-medium uppercase'>
                    Ultima actualizacion de precio
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    {formatDate(product.lastPriceUpdate)}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className='text-muted-foreground mb-2 text-xs font-medium uppercase'>
                Materiales (BOM)
              </p>
              {bomLoading ? (
                <p className='text-muted-foreground text-sm'>
                  Cargando materiales...
                </p>
              ) : bomItems.length === 0 ? (
                <p className='text-muted-foreground text-sm'>
                  Sin materiales definidos
                </p>
              ) : (
                (() => {
                  const costMap = new Map(
                    costBreakdown.map((cb) => [cb.supplyId, cb]),
                  );
                  const totalCost = costBreakdown.reduce(
                    (sum, cb) => sum + (cb.lineCost ?? 0),
                    0,
                  );
                  const margin = formatMargin(
                    product.cost,
                    product.currentPrice,
                  );

                  return (
                    <>
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
                                  className={
                                    !item.supply.isActive ? 'opacity-50' : ''
                                  }
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
                                  {formatCost(
                                    totalCost > 0 ? totalCost : product.cost,
                                  )}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div className='text-muted-foreground flex flex-wrap gap-4 text-sm'>
                        <span>
                          Costo total:{' '}
                          <span className='text-foreground font-medium'>
                            {formatCost(product.cost)}
                          </span>
                        </span>
                        <span>
                          Precio venta:{' '}
                          <span className='text-foreground font-medium'>
                            {formatSellingPrice(product.currentPrice)}
                          </span>
                        </span>
                        <span>
                          Margen:{' '}
                          <span className='text-foreground font-medium'>
                            {margin.amount}
                            {margin.percent !== '\u2014' && (
                              <span className='text-muted-foreground ml-1'>
                                ({margin.percent})
                              </span>
                            )}
                          </span>
                        </span>
                      </div>
                    </>
                  );
                })()
              )}
            </div>

            {isAdmin && (
              <>
                <div className='flex flex-wrap items-center gap-2 border-t pt-3'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setShowEditDialog(true)}
                  >
                    <Pencil className='mr-1 size-3' />
                    Editar
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
                    Precio venta
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
                    <Badge
                      variant={product.isActive ? 'default' : 'destructive'}
                    >
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
                  <AddSellingPriceInline
                    productId={product.id}
                    onClose={() => setShowPriceInline(false)}
                  />
                )}
              </>
            )}
          </div>
        </TableCell>
      </TableRow>

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
        onSuccess={() => {
          void fetchBom();
          router.refresh();
        }}
      />

      <PriceHistoryDialog
        productId={product.id}
        productName={getProductDisplayName(product)}
        open={showPriceHistory}
        onOpenChange={setShowPriceHistory}
      />
    </>
  );
}
