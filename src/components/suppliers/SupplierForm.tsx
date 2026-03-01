'use client';

import type { ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  address: z.string().max(500).optional().or(z.literal('')),
  email: z.string().email('Email invalido').or(z.literal('')).optional(),
  phone: z.string().max(50).optional().or(z.literal('')),
  whatsapp: z.string().max(50).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  defaultValues?: SupplierFormData;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  isLoading?: boolean;
  title: string;
}

export function SupplierForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  title,
}: SupplierFormProps): ReactElement {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: defaultValues ?? {
      name: '',
      address: '',
      email: '',
      phone: '',
      whatsapp: '',
      description: '',
    },
  });

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-semibold tracking-tight'>{title}</h1>

      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className='space-y-6'
      >
        <div className='space-y-2'>
          <Label htmlFor='name'>
            Nombre <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='name'
            {...register('name')}
            placeholder='Nombre del proveedor'
            disabled={isLoading}
          />
          {errors.name && (
            <p className='text-destructive text-sm'>{errors.name.message}</p>
          )}
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='address'>Direccion</Label>
            <Input
              id='address'
              {...register('address')}
              placeholder='Direccion'
              disabled={isLoading}
            />
            {errors.address && (
              <p className='text-destructive text-sm'>
                {errors.address.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              {...register('email')}
              placeholder='email@ejemplo.com'
              disabled={isLoading}
            />
            {errors.email && (
              <p className='text-destructive text-sm'>{errors.email.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone'>Telefono</Label>
            <Input
              id='phone'
              {...register('phone')}
              placeholder='Telefono'
              disabled={isLoading}
            />
            {errors.phone && (
              <p className='text-destructive text-sm'>{errors.phone.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='whatsapp'>WhatsApp</Label>
            <Input
              id='whatsapp'
              {...register('whatsapp')}
              placeholder='WhatsApp'
              disabled={isLoading}
            />
            {errors.whatsapp && (
              <p className='text-destructive text-sm'>
                {errors.whatsapp.message}
              </p>
            )}
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='description'>Descripcion</Label>
          <textarea
            id='description'
            {...register('description')}
            placeholder='Notas sobre el proveedor...'
            disabled={isLoading}
            className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
            rows={3}
          />
          {errors.description && (
            <p className='text-destructive text-sm'>
              {errors.description.message}
            </p>
          )}
        </div>

        <div className='flex gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/proveedores')}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type='submit' disabled={isLoading}>
            {isLoading && <Loader2 className='mr-2 size-4 animate-spin' />}
            Guardar
          </Button>
        </div>
      </form>
    </div>
  );
}

export type { SupplierFormData };
