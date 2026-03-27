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
import type { Expense, ExpenseCategory } from './types';

const expenseSchema = z.object({
  amount: z
    .string()
    .min(1, 'El monto es obligatorio')
    .refine((v) => parseFloat(v) > 0, 'El monto debe ser mayor a 0'),
  concept: z
    .string()
    .min(1, 'El concepto es obligatorio')
    .max(500, 'Maximo 500 caracteres'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  categoryId: z.string().uuid('Selecciona una categoria'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExpenseCategory[];
  expense?: Expense;
  onSuccess: () => void;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  categories,
  expense,
  onSuccess,
}: ExpenseFormDialogProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const isEdit = !!expense;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: '',
      concept: '',
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
    },
  });

  useEffect(() => {
    if (expense) {
      reset({
        amount: expense.amount,
        concept: expense.concept,
        date: expense.date,
        categoryId: expense.category.id,
      });
    } else {
      reset({
        amount: '',
        concept: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
      });
    }
  }, [expense, open, reset]);

  async function onSubmit(data: ExpenseFormData): Promise<void> {
    try {
      const body = {
        amount: parseFloat(data.amount),
        concept: data.concept,
        date: data.date,
        categoryId: data.categoryId,
      };

      if (isEdit) {
        await apiClientFetch(`/api/expenses/${expense.id}`, token, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast.success('Gasto actualizado');
      } else {
        await apiClientFetch('/api/expenses', token, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success('Gasto creado');
      }

      onOpenChange(false);
      reset();
      onSuccess();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar gasto',
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar gasto' : 'Nuevo gasto'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className='space-y-4'
        >
          <div className='space-y-2'>
            <Label htmlFor='expense-amount'>
              Monto <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='expense-amount'
              type='number'
              step='0.01'
              min='0'
              {...register('amount')}
              placeholder='0.00'
              disabled={isSubmitting}
            />
            {errors.amount && (
              <p className='text-destructive text-sm'>
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='expense-concept'>
              Concepto <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='expense-concept'
              {...register('concept')}
              placeholder='Descripcion del gasto'
              disabled={isSubmitting}
            />
            {errors.concept && (
              <p className='text-destructive text-sm'>
                {errors.concept.message}
              </p>
            )}
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='expense-date'>
                Fecha <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='expense-date'
                type='date'
                {...register('date')}
                disabled={isSubmitting}
              />
              {errors.date && (
                <p className='text-destructive text-sm'>
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>
                Categoria <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={watch('categoryId') || undefined}
                onValueChange={(value) =>
                  setValue('categoryId', value, { shouldValidate: true })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Seleccionar categoria' />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className='text-destructive text-sm'>
                  {errors.categoryId.message}
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
              {isEdit ? 'Guardar cambios' : 'Crear gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
