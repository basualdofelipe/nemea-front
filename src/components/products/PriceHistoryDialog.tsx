'use client';

import type { ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClientFetch } from '@/lib/api-client';
import { formatDate } from '@/lib/formatters';
import type { PriceRecord } from './types';

interface PriceHistoryDialogProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriceHistoryDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: PriceHistoryDialogProps): ReactElement {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef<string | null>(null);

  const fetchPrices = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);
      try {
        const res = await apiClientFetch<{ data: PriceRecord[] }>(
          `/api/products/${id}/prices`,
          token,
        );
        setPrices(res.data);
      } catch {
        setPrices([]);
      } finally {
        setIsLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!open) {
      hasFetchedRef.current = null;
      return;
    }

    if (hasFetchedRef.current === productId) return;
    hasFetchedRef.current = productId;

    void fetchPrices(productId);
  }, [open, productId, fetchPrices]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historial de precios - {productName}</DialogTitle>
        </DialogHeader>

        <div className='max-h-80 space-y-2 overflow-y-auto'>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : prices.length === 0 ? (
            <p className='text-muted-foreground py-4 text-center text-sm'>
              Sin historial de precios.
            </p>
          ) : (
            prices.map((record) => (
              <div
                key={record.id}
                className='flex items-center justify-between rounded-md border px-4 py-2'
              >
                <span className='text-muted-foreground text-sm'>
                  {formatDate(record.createdAt)}
                </span>
                <span className='font-semibold'>
                  ${parseFloat(record.price).toLocaleString('es-AR')}
                </span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
