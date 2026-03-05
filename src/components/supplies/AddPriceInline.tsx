'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClientFetch } from '@/lib/api-client';

interface AddPriceInlineProps {
  supplyId: string;
  onClose: () => void;
}

export function AddPriceInline({
  supplyId,
  onClose,
}: AddPriceInlineProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm(): Promise<void> {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error('Ingresa un precio valido');
      return;
    }

    setIsLoading(true);
    try {
      await apiClientFetch(`/api/supplies/${supplyId}/prices`, token, {
        method: 'POST',
        body: JSON.stringify({ price: numPrice }),
      });
      toast.success('Precio actualizado');
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al agregar precio',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='flex items-center gap-2 pt-2'>
      <Input
        type='number'
        step='0.01'
        min='0'
        placeholder='Nuevo precio'
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className='w-40'
        disabled={isLoading}
        autoFocus
      />
      <Button
        size='icon'
        variant='ghost'
        onClick={() => void handleConfirm()}
        disabled={isLoading || !price}
        className='size-8'
      >
        {isLoading ? (
          <Loader2 className='size-4 animate-spin' />
        ) : (
          <Check className='size-4' />
        )}
      </Button>
      <Button
        size='icon'
        variant='ghost'
        onClick={onClose}
        disabled={isLoading}
        className='size-8'
      >
        <X className='size-4' />
      </Button>
    </div>
  );
}
