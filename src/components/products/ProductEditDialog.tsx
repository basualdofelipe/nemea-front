'use client';

import { useEffect, useMemo, type ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import type { CatalogItem, Product } from './types';

const editSchema = z.object({
  typeId: z.string().uuid('Selecciona un tipo'),
  nameId: z.string().uuid('Selecciona un nombre'),
  finishId: z.string().uuid('Selecciona una terminacion'),
  colorId: z.string().uuid('Selecciona un color'),
  sizeId: z.string().uuid('Selecciona un talle'),
});

type EditFormData = z.infer<typeof editSchema>;

interface ProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  types: CatalogItem[];
  names: CatalogItem[];
  finishes: CatalogItem[];
  colors: CatalogItem[];
  sizes: CatalogItem[];
}

export function ProductEditDialog({
  open,
  onOpenChange,
  product,
  types,
  names,
  finishes,
  colors,
  sizes,
}: ProductEditDialogProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const {
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      typeId: product.type.id,
      nameId: product.name.id,
      finishId: product.finish.id,
      colorId: product.color.id,
      sizeId: product.size.id,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        typeId: product.type.id,
        nameId: product.name.id,
        finishId: product.finish.id,
        colorId: product.color.id,
        sizeId: product.size.id,
      });
    }
  }, [product, open, reset]);

  const typeId = watch('typeId');
  const nameId = watch('nameId');
  const finishId = watch('finishId');
  const colorId = watch('colorId');
  const sizeId = watch('sizeId');

  const skuPreview = useMemo((): string => {
    const t = types.find((x) => x.id === typeId);
    const n = names.find((x) => x.id === nameId);
    const f = finishes.find((x) => x.id === finishId);
    const c = colors.find((x) => x.id === colorId);
    const s = sizes.find((x) => x.id === sizeId);
    if (!t || !n || !f || !c || !s) return '...';
    return [t.skuCode, n.skuCode, f.skuCode, c.skuCode, s.skuCode].join('.');
  }, [
    types,
    names,
    finishes,
    colors,
    sizes,
    typeId,
    nameId,
    finishId,
    colorId,
    sizeId,
  ]);

  async function onSubmit(data: EditFormData): Promise<void> {
    try {
      await apiClientFetch(`/api/products/${product.id}`, token, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      toast.success('Producto actualizado');
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al actualizar producto',
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className='space-y-4'
        >
          <div className='bg-muted/30 rounded-md border p-3'>
            <p className='text-muted-foreground text-xs font-semibold uppercase'>
              SKU Preview
            </p>
            <p className='font-mono text-lg'>{skuPreview}</p>
          </div>

          <div className='space-y-2'>
            <Label>
              Tipo <span className='text-destructive'>*</span>
            </Label>
            <Select
              value={typeId}
              onValueChange={(value) =>
                setValue('typeId', value, { shouldValidate: true })
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Seleccionar tipo' />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
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

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>
                Nombre <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={nameId}
                onValueChange={(value) =>
                  setValue('nameId', value, { shouldValidate: true })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Seleccionar nombre' />
                </SelectTrigger>
                <SelectContent>
                  {names.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nameId && (
                <p className='text-destructive text-sm'>
                  {errors.nameId.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>
                Terminacion <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={finishId}
                onValueChange={(value) =>
                  setValue('finishId', value, { shouldValidate: true })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Seleccionar terminacion' />
                </SelectTrigger>
                <SelectContent>
                  {finishes.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.finishId && (
                <p className='text-destructive text-sm'>
                  {errors.finishId.message}
                </p>
              )}
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>
                Color <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={colorId}
                onValueChange={(value) =>
                  setValue('colorId', value, { shouldValidate: true })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Seleccionar color' />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.colorId && (
                <p className='text-destructive text-sm'>
                  {errors.colorId.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>
                Talle <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={sizeId}
                onValueChange={(value) =>
                  setValue('sizeId', value, { shouldValidate: true })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Seleccionar talle' />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sizeId && (
                <p className='text-destructive text-sm'>
                  {errors.sizeId.message}
                </p>
              )}
            </div>
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
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
