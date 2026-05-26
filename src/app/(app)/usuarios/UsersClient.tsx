'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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
import type { RoleOption } from '@/types/role';
import { EditUserDialog } from './EditUserDialog';
import { DeleteUserAlertDialog } from './DeleteUserAlertDialog';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: { id: string; name: string };
  isActive: boolean;
  createdAt: string;
}

interface UsersClientProps {
  users: UserRow[];
  roles: RoleOption[];
}

const createUserSchema = z.object({
  email: z.string().email('Email invalido').min(1, 'El email es obligatorio'),
  name: z.string().optional(),
  roleId: z.string().uuid('Selecciona un rol'),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export function UsersClient({ users, roles }: UsersClientProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const currentUserId = session?.user?.id;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

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
      roleId: '',
    },
  });

  async function onCreateUser(data: CreateUserFormData): Promise<void> {
    try {
      await apiClientFetch('/api/users', token, {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          roleId: data.roleId,
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
                  <TableCell className='font-semibold'>{user.email}</TableCell>
                  <TableCell>{user.name ?? '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role.name === 'ADMIN' ? 'default' : 'secondary'
                      }
                    >
                      {user.role.name}
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
                    <div className='flex items-center justify-end gap-2'>
                      {/* IN-A2: SPEC line "Editar disabled or hidden on own
                          row only for role" is literally ambiguous. We
                          render Editar unconditionally because the only
                          field actually disabled on the own row is the
                          role Select (and the Active Switch) -- the name
                          stays editable. Disabling the whole button would
                          stop admins from changing their own name. The
                          per-control disable happens inside EditUserDialog
                          via the DisabledTooltip helper (WR-09). */}
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setEditTarget(user)}
                      >
                        <Pencil className='mr-1 size-3' />
                        Editar
                      </Button>
                      {user.id === currentUserId ? (
                        <span className='text-muted-foreground text-xs'>
                          (tu cuenta)
                        </span>
                      ) : (
                        <Button
                          size='sm'
                          variant='outline'
                          className='text-destructive hover:text-destructive'
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className='mr-1 size-3' />
                          Borrar
                        </Button>
                      )}
                    </div>
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
              <Label>
                Rol <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={watch('roleId')}
                onValueChange={(value) =>
                  setValue('roleId', value, { shouldValidate: true })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Selecciona un rol' />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleId && (
                <p className='text-destructive text-sm'>
                  {errors.roleId.message}
                </p>
              )}
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

      <EditUserDialog
        user={editTarget}
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        roles={roles}
        isOwnRow={Boolean(currentUserId) && editTarget?.id === currentUserId}
        onSuccess={() => {
          setEditTarget(null);
          router.refresh();
        }}
      />
      <DeleteUserAlertDialog
        user={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onSuccess={() => {
          setDeleteTarget(null);
          router.refresh();
        }}
      />
    </>
  );
}
