'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiClientFetch } from '@/lib/api-client';
import { formatDate } from '@/lib/formatters';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
}

interface UsersClientProps {
  users: UserRow[];
}

const createUserSchema = z.object({
  email: z.string().email('Email invalido').min(1, 'El email es obligatorio'),
  name: z.string().optional(),
  role: z.enum(['admin', 'user']),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export function UsersClient({ users }: UsersClientProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const currentUserId = session?.user?.id;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      name: '',
      role: 'user',
    },
  });

  async function onCreateUser(data: CreateUserFormData): Promise<void> {
    try {
      await apiClientFetch('/api/users', token, {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          role: data.role,
          name: data.name || undefined,
        }),
      });
      toast.success('Usuario creado');
      setShowCreateDialog(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear usuario',
      );
    }
  }

  async function handleToggleStatus(user: UserRow): Promise<void> {
    setTogglingId(user.id);
    try {
      await apiClientFetch(`/api/users/${user.id}/toggle-status`, token, {
        method: 'PATCH',
      });
      toast.success(`Usuario ${user.isActive ? 'desactivado' : 'activado'}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al cambiar estado',
      );
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      <div className='flex items-center justify-end'>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className='mr-1 size-4' />
          Nuevo usuario
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha creacion</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='text-muted-foreground h-16 text-center'
                >
                  No hay usuarios registrados.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className={!user.isActive ? 'opacity-50' : ''}
                >
                  <TableCell className='font-medium'>{user.email}</TableCell>
                  <TableCell>{user.name ?? '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Usuario'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    {user.id === currentUserId ? (
                      <span className='text-muted-foreground text-xs'>
                        (tu cuenta)
                      </span>
                    ) : (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => void handleToggleStatus(user)}
                        disabled={togglingId === user.id}
                      >
                        {togglingId === user.id ? (
                          <Loader2 className='mr-1 size-3 animate-spin' />
                        ) : null}
                        {user.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => void handleSubmit(onCreateUser)(e)}
            className='space-y-4'
          >
            <div className='space-y-2'>
              <Label htmlFor='user-email'>
                Email <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='user-email'
                type='email'
                {...register('email')}
                placeholder='usuario@ejemplo.com'
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className='text-destructive text-sm'>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='user-name'>Nombre</Label>
              <Input
                id='user-name'
                {...register('name')}
                placeholder='Nombre del usuario'
                disabled={isSubmitting}
              />
            </div>

            <div className='space-y-2'>
              <Label>Rol</Label>
              <Select
                value={watch('role')}
                onValueChange={(value) =>
                  setValue('role', value as 'admin' | 'user', {
                    shouldValidate: true,
                  })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Seleccionar rol' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='user'>Usuario</SelectItem>
                  <SelectItem value='admin'>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowCreateDialog(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className='mr-2 size-4 animate-spin' />
                )}
                Crear usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
