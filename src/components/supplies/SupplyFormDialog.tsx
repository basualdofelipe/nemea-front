'use client';

import { useEffect, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClientFetch } from '@/lib/api-client';
import type { Supply, SupplyType, Supplier } from './types';

const supplySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  typeId: z.string().uuid('Selecciona un tipo'),
  supplierId: z.string().optional().or(z.literal('')),
  unitType: z.enum(['m2', 'unidad', 'metro', 'kg']),
  notes: z.string().optional().or(z.literal('')),
  initialPrice: z.string().optional().or(z.literal('')),
});

type SupplyFormData = z.infer<typeof supplySchema>;

interface SupplyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplyTypes: SupplyType[];
  suppliers: Supplier[];
  supply?: Supply; // undefined = create mode
}

export function SupplyFormDialog({
  open,
  onOpenChange,
  supplyTypes,
  suppliers,
  supply,
}: SupplyFormDialogProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const isEdit = !!supply;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplyFormData>({
    resolver: zodResolver(supplySchema),
    defaultValues: isEdit
      ? {
          name: supply.name,
          typeId: supply.type.id,
          unitType: supply.unitType,
          notes: supply.notes ?? '',
          supplierId: '',
          initialPrice: '',
        }
      : {
          name: '',
          typeId: '',
          supplierId: '',
          unitType: 'm2',
          notes: '',
          initialPrice: '',
        },
  });

  useEffect(() => {
    if (supply) {
      reset({
        name: supply.name,
        typeId: supply.type.id,
        unitType: supply.unitType,
        notes: supply.notes ?? '',
        supplierId: '',
        initialPrice: '',
      });
    } else {
      reset({
        name: '',
        typeId: '',
        supplierId: '',
        unitType: 'm2',
        notes: '',
        initialPrice: '',
      });
    }
  }, [supply, open, reset]);

  async function onSubmit(data: SupplyFormData): Promise<void> {
    try {
      if (isEdit) {
        const { name, typeId, unitType, notes } = data;
        await apiClientFetch(`/api/supplies/${supply.id}`, token, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            typeId,
            unitType,
            notes: notes || undefined,
          }),
        });
        toast.success('Insumo actualizado');
      } else {
        if (!data.supplierId) {
          toast.error('Selecciona un proveedor');
          return;
        }
        const body: Record<string, unknown> = {
          name: data.name,
          typeId: data.typeId,
          supplierId: data.supplierId,
          unitType: data.unitType,
          notes: data.notes || undefined,
        };
        if (data.initialPrice && data.initialPrice !== '') {
          body.initialPrice = parseFloat(data.initialPrice);
        }
        await apiClientFetch('/api/supplies', token, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success('Insumo creado');
      }
      onOpenChange(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar insumo',
      );
    }
  }

  const UNIT_OPTIONS = [
    { value: 'm2', label: 'm\u00B2' },
    { value: 'unidad', label: 'Unidad' },
    { value: 'metro', label: 'Metro' },
    { value: 'kg', label: 'Kg' },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar insumo' : 'Nuevo insumo'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className='space-y-4'
        >
          <div className='space-y-2'>
            <Label htmlFor='supply-name'>
              Nombre <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='supply-name'
              {...register('name')}
              placeholder='Nombre del insumo'
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className='text-destructive text-sm'>{errors.name.message}</p>
            )}
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>
                Tipo <span className='text-destructive'>*</span>
              </Label>
              <Select
                defaultValue={isEdit ? supply.type.id : undefined}
                onValueChange={(value) =>
                  setValue('typeId', value, { shouldValidate: true })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Seleccionar tipo' />
                </SelectTrigger>
                <SelectContent>
                  {supplyTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.typeId && (
                <p className='text-destructive text-sm'>
                  {errors.typeId.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>
                Unidad <span className='text-destructive'>*</span>
              </Label>
              <Select
                defaultValue={isEdit ? supply.unitType : 'm2'}
                onValueChange={(value) =>
                  setValue('unitType', value as SupplyFormData['unitType'], {
                    shouldValidate: true,
                  })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Seleccionar unidad' />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unitType && (
                <p className='text-destructive text-sm'>
                  {errors.unitType.message}
                </p>
              )}
            </div>
          </div>

          {!isEdit && (
            <div className='space-y-2'>
              <Label>
                Proveedor <span className='text-destructive'>*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue('supplierId', value, { shouldValidate: true })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Seleccionar proveedor' />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierId && (
                <p className='text-destructive text-sm'>
                  {errors.supplierId.message}
                </p>
              )}
            </div>
          )}

          {isEdit && (
            <div className='space-y-2'>
              <Label>Proveedor</Label>
              <Input
                value={supply.supplier.name}
                disabled
                className='opacity-60'
              />
              <p className='text-muted-foreground text-xs'>
                El proveedor no se puede modificar.
              </p>
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='supply-notes'>Notas</Label>
            <textarea
              id='supply-notes'
              {...register('notes')}
              placeholder='Notas sobre el insumo...'
              disabled={isSubmitting}
              className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
              rows={2}
            />
          </div>

          {!isEdit && (
            <div className='space-y-2'>
              <Label htmlFor='initial-price'>Precio inicial (opcional)</Label>
              <Input
                id='initial-price'
                type='number'
                step='0.01'
                min='0'
                {...register('initialPrice')}
                placeholder='0.00'
                disabled={isSubmitting}
              />
            </div>
          )}

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
              {isEdit ? 'Guardar cambios' : 'Crear insumo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
