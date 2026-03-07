'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiClientFetch } from '@/lib/api-client';
import type { Expense } from './types';
import { formatAmount } from './types';

interface DeleteExpenseDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteExpenseDialog({
  expense,
  open,
  onOpenChange,
  onSuccess,
}: DeleteExpenseDialogProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(): Promise<void> {
    if (!expense) return;

    setIsDeleting(true);
    try {
      await apiClientFetch(`/api/expenses/${expense.id}`, token, {
        method: 'DELETE',
      });
      toast.success('Gasto eliminado');
      onOpenChange(false);
      onSuccess();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar gasto',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar este gasto?</AlertDialogTitle>
          <AlertDialogDescription>
            {expense && (
              <>
                Se eliminara el gasto &quot;{expense.concept}&quot; por $
                {formatAmount(expense.amount)}. Esta accion no se puede
                deshacer.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={isDeleting}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isDeleting && <Loader2 className='mr-2 size-4 animate-spin' />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
