'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiClientFetch } from '@/lib/api-client';
import type { RoleRow } from '@/types/role';
import type { Permissions } from '@/types/permissions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PERMISSION_KEYS = [
  'canViewProducts',
  'canEditProducts',
  'canViewSupplies',
  'canEditSupplies',
  'canViewExpenses',
  'canEditExpenses',
  'canUseCalculator',
  'canManageScenarios',
  'canViewDashboard',
  'canManageConfig',
  'canManageUsers',
] as const;

function countPermissions(role: RoleRow): number {
  return PERMISSION_KEYS.filter((k) => role[k]).length;
}

function permissionBadgeVariant(
  count: number,
): 'default' | 'secondary' | 'outline' {
  if (count === 11) return 'default';
  if (count > 0) return 'secondary';
  return 'outline';
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const roleSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Maximo 100 caracteres'),
  description: z
    .string()
    .max(255, 'Maximo 255 caracteres')
    .optional()
    .or(z.literal('')),
  canViewProducts: z.boolean(),
  canEditProducts: z.boolean(),
  canViewSupplies: z.boolean(),
  canEditSupplies: z.boolean(),
  canViewExpenses: z.boolean(),
  canEditExpenses: z.boolean(),
  canUseCalculator: z.boolean(),
  canManageScenarios: z.boolean(),
  canViewDashboard: z.boolean(),
  canManageConfig: z.boolean(),
  canManageUsers: z.boolean(),
});

type RoleFormData = z.infer<typeof roleSchema>;

// ---------------------------------------------------------------------------
// Permission labels & groups
// ---------------------------------------------------------------------------

const PERMISSION_LABELS: Record<keyof Permissions, string> = {
  canViewProducts: 'Ver productos',
  canEditProducts: 'Editar productos',
  canViewSupplies: 'Ver insumos y proveedores',
  canEditSupplies: 'Editar insumos y proveedores',
  canViewExpenses: 'Ver gastos',
  canEditExpenses: 'Editar gastos',
  canUseCalculator: 'Usar calculadora',
  canManageScenarios: 'Gestionar escenarios',
  canViewDashboard: 'Ver dashboard (proximamente)',
  canManageConfig: 'Configurar Tiendanube',
  canManageUsers: 'Gestionar usuarios y roles',
};

interface PermissionGroup {
  title: string;
  keys: (keyof Permissions)[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: 'Productos',
    keys: ['canViewProducts', 'canEditProducts'],
  },
  {
    title: 'Insumos y proveedores',
    keys: ['canViewSupplies', 'canEditSupplies'],
  },
  {
    title: 'Gastos',
    keys: ['canViewExpenses', 'canEditExpenses'],
  },
  {
    title: 'Herramientas',
    keys: ['canUseCalculator', 'canManageScenarios', 'canViewDashboard'],
  },
  {
    title: 'Administracion',
    keys: ['canManageConfig', 'canManageUsers'],
  },
];

const VIEW_EDIT_PAIRS: [keyof Permissions, keyof Permissions][] = [
  ['canViewProducts', 'canEditProducts'],
  ['canViewSupplies', 'canEditSupplies'],
  ['canViewExpenses', 'canEditExpenses'],
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RolesClientProps {
  initialRoles: RoleRow[];
}

export function RolesClient({ initialRoles }: RolesClientProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [roles] = useState<RoleRow[]>(initialRoles);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<RoleRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      canViewProducts: false,
      canEditProducts: false,
      canViewSupplies: false,
      canEditSupplies: false,
      canViewExpenses: false,
      canEditExpenses: false,
      canUseCalculator: false,
      canManageScenarios: false,
      canViewDashboard: false,
      canManageConfig: false,
      canManageUsers: false,
    },
  });

  // -------------------------------------------------------------------------
  // Permission dependency logic
  // -------------------------------------------------------------------------

  function handlePermissionToggle(
    field: keyof Permissions,
    value: boolean,
  ): void {
    setValue(field, value);

    for (const [viewKey, editKey] of VIEW_EDIT_PAIRS) {
      if (field === editKey && value === true) {
        // Turning ON edit -> auto-check view
        setValue(viewKey, true);
      }
      if (field === viewKey && value === false) {
        // Turning OFF view -> auto-uncheck edit
        setValue(editKey, false);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Dialog open helpers
  // -------------------------------------------------------------------------

  function openCreateDialog(): void {
    setEditingRole(null);
    reset({
      name: '',
      description: '',
      canViewProducts: false,
      canEditProducts: false,
      canViewSupplies: false,
      canEditSupplies: false,
      canViewExpenses: false,
      canEditExpenses: false,
      canUseCalculator: false,
      canManageScenarios: false,
      canViewDashboard: false,
      canManageConfig: false,
      canManageUsers: false,
    });
    setDialogOpen(true);
  }

  function openEditDialog(role: RoleRow): void {
    setEditingRole(role);
    reset({
      name: role.name,
      description: role.description ?? '',
      canViewProducts: role.canViewProducts,
      canEditProducts: role.canEditProducts,
      canViewSupplies: role.canViewSupplies,
      canEditSupplies: role.canEditSupplies,
      canViewExpenses: role.canViewExpenses,
      canEditExpenses: role.canEditExpenses,
      canUseCalculator: role.canUseCalculator,
      canManageScenarios: role.canManageScenarios,
      canViewDashboard: role.canViewDashboard,
      canManageConfig: role.canManageConfig,
      canManageUsers: role.canManageUsers,
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(role: RoleRow): void {
    setDeletingRole(role);
    setDeleteDialogOpen(true);
  }

  // -------------------------------------------------------------------------
  // CRUD handlers
  // -------------------------------------------------------------------------

  async function onSubmit(data: RoleFormData): Promise<void> {
    setIsSubmitting(true);
    try {
      if (editingRole) {
        await apiClientFetch(`/api/roles/${editingRole.id}`, token, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
        toast.success('Rol actualizado');
      } else {
        await apiClientFetch('/api/roles', token, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        toast.success('Rol creado');
      }
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingRole
            ? 'Error al guardar cambios'
            : 'Error al crear rol',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onDelete(): Promise<void> {
    if (!deletingRole) return;
    setIsDeleting(true);
    try {
      await apiClientFetch(`/api/roles/${deletingRole.id}`, token, {
        method: 'DELETE',
      });
      toast.success('Rol eliminado');
      setDeleteDialogOpen(false);
      setDeletingRole(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar rol',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const customRoles = roles.filter((r) => !r.isSystem);
  const hasCustomRoles = customRoles.length > 0;

  return (
    <>
      {/* CTA */}
      <div className='flex justify-end'>
        <Button onClick={openCreateDialog}>Crear rol</Button>
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripcion</TableHead>
              <TableHead className='w-[100px] text-center'>Usuarios</TableHead>
              <TableHead className='w-[120px] text-center'>Permisos</TableHead>
              <TableHead className='w-[200px] text-right'>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-muted-foreground h-16 text-center'
                >
                  No hay roles configurados.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => {
                const permCount = countPermissions(role);
                return (
                  <TableRow key={role.id}>
                    <TableCell className='font-medium'>
                      <span className='flex items-center gap-2'>
                        {role.name}
                        {role.isSystem && (
                          <Badge variant='outline'>Sistema</Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {role.description ?? '-'}
                    </TableCell>
                    <TableCell className='text-center'>
                      {role.userCount}
                    </TableCell>
                    <TableCell className='text-center'>
                      <Badge variant={permissionBadgeVariant(permCount)}>
                        {permCount}/11
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => openEditDialog(role)}
                        >
                          Editar
                        </Button>
                        {!role.isSystem && (
                          <Button
                            variant='outline'
                            size='sm'
                            className='text-destructive'
                            onClick={() => openDeleteDialog(role)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Empty custom roles message */}
      {roles.length > 0 && !hasCustomRoles && (
        <p className='text-muted-foreground text-center text-sm'>
          No hay roles personalizados. Crea uno para asignar permisos
          especificos.
        </p>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? `Editar rol: ${editingRole.name}` : 'Crear rol'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
            className='space-y-4'
          >
            <div className='max-h-[70vh] space-y-4 overflow-y-auto pr-1'>
              {/* Info section */}
              <div className='space-y-3'>
                <div className='space-y-2'>
                  <Label htmlFor='role-name'>
                    Nombre del rol{' '}
                    <span className='text-destructive'>*</span>
                  </Label>
                  <Input
                    id='role-name'
                    {...register('name')}
                    placeholder='Ej: INVERSOR'
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className='text-destructive text-sm'>
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='role-description'>Descripcion</Label>
                  <Input
                    id='role-description'
                    {...register('description')}
                    placeholder='Descripcion del rol'
                    disabled={isSubmitting}
                  />
                  {errors.description && (
                    <p className='text-destructive text-sm'>
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Permission groups */}
              {PERMISSION_GROUPS.map((group, groupIdx) => (
                <div key={group.title}>
                  <Separator />
                  <p className='text-muted-foreground pt-2 pb-1 text-sm font-semibold uppercase tracking-wide'>
                    {group.title}
                  </p>
                  {group.keys.map((permKey) => (
                    <div
                      key={permKey}
                      className='flex items-center justify-between py-2'
                    >
                      <Label
                        htmlFor={`perm-${groupIdx}-${permKey}`}
                        className='font-normal'
                      >
                        {PERMISSION_LABELS[permKey]}
                      </Label>
                      <Switch
                        id={`perm-${groupIdx}-${permKey}`}
                        checked={watch(permKey) ?? false}
                        onCheckedChange={(checked) =>
                          handlePermissionToggle(permKey, checked)
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className='mr-2 size-4 animate-spin' />
                )}
                {editingRole ? 'Guardar cambios' : 'Crear rol'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar rol</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara el rol &quot;{deletingRole?.name}&quot;. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void onDelete();
              }}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting && (
                <Loader2 className='mr-2 size-4 animate-spin' />
              )}
              Eliminar rol
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
