'use client';

import type { ReactElement } from 'react';
import { useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { apiClientFetch } from '@/lib/api-client';
import type { RoleOption } from '@/types/role';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: { id: string; name: string };
  isActive: boolean;
  createdAt: string;
}

const editUserSchema = z.object({
  name: z.string().max(255).optional().or(z.literal('')),
  roleId: z.string().uuid('Selecciona un rol'),
  isActive: z.boolean(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleOption[];
  isOwnRow: boolean;
  onSuccess: () => void;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  roles,
  isOwnRow,
  onSuccess,
}: EditUserDialogProps): ReactElement | null {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const formValues = useMemo<EditUserFormData>(
    () => ({
      name: user?.name ?? '',
      roleId: user?.role.id ?? '',
      isActive: user?.isActive ?? true,
    }),
    [user],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    values: formValues,
  });

  // Defensive: ensure form resets when the target user changes (e.g. dialog
  // re-opened with a different row). `values` should keep this in sync, but
  // calling reset explicitly avoids any stale watch() values in tests where
  // jsdom + RHF timing can desync.
  useEffect(() => {
    if (user) {
      reset(formValues);
    }
  }, [user, reset, formValues]);

  if (!user) {
    return null;
  }

  async function onSubmit(data: EditUserFormData): Promise<void> {
    if (!user) return;

    const dto: Record<string, unknown> = {};
    // Trim and normalize empty string to null so the backend delete suffix
    // ('usuario borrado' fallback) fires correctly when the admin clears the
    // name. Backend also has a defensive trim, but normalizing here keeps the
    // DB clean (no rows with name='' floating around).
    const trimmedNext = (data.name ?? '').trim();
    const normalizedNext = trimmedNext === '' ? null : trimmedNext;
    const currentName = user.name ?? null;
    if (normalizedNext !== currentName) {
      dto.name = normalizedNext;
    }
    if (data.roleId !== user.role.id) {
      dto.roleId = data.roleId;
    }
    if (data.isActive !== user.isActive) {
      dto.isActive = data.isActive;
    }

    try {
      await apiClientFetch(`/api/users/${user.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
      toast.success('Usuario actualizado');
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el usuario',
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription className='sr-only'>
            Editar nombre, rol y estado del usuario.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className='space-y-4'
        >
          <div className='space-y-2'>
            <Label htmlFor='edit-user-email'>Email</Label>
            <Input
              id='edit-user-email'
              type='email'
              value={user.email}
              readOnly
              className='bg-muted text-muted-foreground cursor-not-allowed'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit-user-name'>Nombre</Label>
            <Input
              id='edit-user-name'
              {...register('name')}
              placeholder='Nombre del usuario'
              disabled={isSubmitting}
              autoFocus
            />
            {errors.name && (
              <p className='text-destructive text-sm'>{errors.name.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='edit-user-role'>Rol</Label>
            {isOwnRow ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className='block'>
                      <Select
                        value={watch('roleId')}
                        onValueChange={(value) =>
                          setValue('roleId', value, { shouldValidate: true })
                        }
                        disabled={isOwnRow || isSubmitting}
                      >
                        <SelectTrigger id='edit-user-role' className='w-full'>
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
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    No puedes cambiar tu propio rol
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Select
                value={watch('roleId')}
                onValueChange={(value) =>
                  setValue('roleId', value, { shouldValidate: true })
                }
                disabled={isOwnRow || isSubmitting}
              >
                <SelectTrigger id='edit-user-role' className='w-full'>
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
            )}
            {errors.roleId && (
              <p className='text-destructive text-sm'>
                {errors.roleId.message}
              </p>
            )}
          </div>

          <div className='flex items-center justify-between'>
            <Label htmlFor='edit-user-active'>Activo</Label>
            {isOwnRow ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Switch
                        id='edit-user-active'
                        checked={watch('isActive')}
                        onCheckedChange={(value) =>
                          setValue('isActive', value, { shouldDirty: true })
                        }
                        disabled={isOwnRow || isSubmitting}
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    No puedes cambiar tu propio estado
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Switch
                id='edit-user-active'
                checked={watch('isActive')}
                onCheckedChange={(value) =>
                  setValue('isActive', value, { shouldDirty: true })
                }
                disabled={isOwnRow || isSubmitting}
              />
            )}
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting && <Loader2 className='mr-2 size-4 animate-spin' />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
