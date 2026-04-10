'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Clock, ExternalLink, History, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';
import { apiClientFetch } from '@/lib/api-client';
import { formatDate } from '@/lib/formatters';
import type { Supply, SupplyType, Supplier } from './types';
import { formatPrice } from './types';
import { AddPriceInline } from './AddPriceInline';
import { SupplyFormDialog } from './SupplyFormDialog';
import { PriceHistoryDialog } from './PriceHistoryDialog';

interface SupplyExpandedRowProps {
  supply: Supply;
  supplyTypes: SupplyType[];
  suppliers: Supplier[];
  canEdit: boolean;
  colSpan: number;
}

export function SupplyExpandedRow({
  supply,
  supplyTypes,
  suppliers,
  canEdit,
  colSpan,
}: SupplyExpandedRowProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [showAddPrice, setShowAddPrice] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  async function handleToggleStatus(): Promise<void> {
    setIsToggling(true);
    try {
      await apiClientFetch(`/api/supplies/${supply.id}/toggle-status`, token, {
        method: 'PATCH',
      });
      toast.success(`Insumo ${supply.isActive ? 'desactivado' : 'activado'}`);
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
                  Notas
                </p>
                <p className='text-sm'>{supply.notes ?? 'Sin notas'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-xs font-medium uppercase'>
                  Proveedor
                </p>
                <Link
                  href={`/proveedores/${supply.supplier.id}/editar`}
                  className='text-primary inline-flex items-center gap-1 text-sm hover:underline'
                >
                  {supply.supplier.name}
                  <ExternalLink className='size-3' />
                </Link>
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <p className='text-muted-foreground text-xs font-medium uppercase'>
                  Precio actual
                </p>
                <p className='text-sm font-medium'>
                  {formatPrice(supply.currentPrice, supply.unitType)}
                </p>
              </div>
              {supply.lastPriceUpdate && (
                <div>
                  <p className='text-muted-foreground text-xs font-medium uppercase'>
                    Ultima actualizacion
                  </p>
                  <p className='text-muted-foreground inline-flex items-center gap-1 text-sm'>
                    <Clock className='size-3' />
                    {formatDate(supply.lastPriceUpdate)}
                  </p>
                </div>
              )}
            </div>

            {canEdit && (
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
                  onClick={() => setShowAddPrice(true)}
                >
                  <Plus className='mr-1 size-3' />
                  Nuevo precio
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setShowHistoryDialog(true)}
                >
                  <History className='mr-1 size-3' />
                  Ver historial
                </Button>
                <div className='ml-auto flex items-center gap-2'>
                  <span className='text-muted-foreground text-sm'>
                    {supply.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                  <Switch
                    checked={supply.isActive}
                    onCheckedChange={() => void handleToggleStatus()}
                    disabled={isToggling}
                  />
                </div>
              </div>
            )}

            {showAddPrice && (
              <AddPriceInline
                supplyId={supply.id}
                onClose={() => setShowAddPrice(false)}
              />
            )}
          </div>
        </TableCell>
      </TableRow>

      <SupplyFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        supplyTypes={supplyTypes}
        suppliers={suppliers}
        supply={supply}
      />

      <PriceHistoryDialog
        supply={supply}
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
      />
    </>
  );
}
