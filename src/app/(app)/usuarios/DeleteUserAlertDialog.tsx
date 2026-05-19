'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
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

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: { id: string; name: string };
  isActive: boolean;
  createdAt: string;
}

interface DeleteUserAlertDialogProps {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteUserAlertDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: DeleteUserAlertDialogProps): ReactElement | null {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) {
    return null;
  }

  async function handleDelete(): Promise<void> {
    if (!user) return;
    setIsDeleting(true);
    try {
      await apiClientFetch(`/api/users/${user.id}`, token, {
        method: 'DELETE',
      });
      toast.success('Usuario eliminado');
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el usuario',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará el usuario <strong>{user.email}</strong>. Sus
            escenarios serán transferidos a tu cuenta con el sufijo &quot; -{' '}
            {user.name ?? 'usuario borrado'}&quot;. Esta acción no se puede
            deshacer.
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
            {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Borrar usuario
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
