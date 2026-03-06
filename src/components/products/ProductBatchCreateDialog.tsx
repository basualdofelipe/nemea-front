'use client';

import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { CatalogItem } from './types';

const step1Schema = z.object({
  typeId: z.string().uuid('Selecciona un tipo'),
  nameId: z.string().uuid('Selecciona un nombre'),
  finishId: z.string().uuid('Selecciona una terminacion'),
});

type Step1Data = z.infer<typeof step1Schema>;

interface ProductBatchCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  types: CatalogItem[];
  names: CatalogItem[];
  finishes: CatalogItem[];
  colors: CatalogItem[];
  sizes: CatalogItem[];
}

const STEP_LABELS = [
  'Tipo, nombre y terminacion',
  'Colores',
  'Talles',
  'Vista previa',
];

export function ProductBatchCreateDialog({
  open,
  onOpenChange,
  types,
  names,
  finishes,
  colors,
  sizes,
}: ProductBatchCreateDialogProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [step, setStep] = useState(0);
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    setValue,
    watch,
    trigger,
    formState: { errors },
    reset,
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      typeId: '',
      nameId: '',
      finishId: '',
    },
  });

  const typeId = watch('typeId');
  const nameId = watch('nameId');
  const finishId = watch('finishId');

  const selectedType = useMemo(
    (): CatalogItem | undefined => types.find((t) => t.id === typeId),
    [types, typeId],
  );
  const selectedName = useMemo(
    (): CatalogItem | undefined => names.find((n) => n.id === nameId),
    [names, nameId],
  );
  const selectedFinish = useMemo(
    (): CatalogItem | undefined => finishes.find((f) => f.id === finishId),
    [finishes, finishId],
  );

  const selectedColors = useMemo(
    (): CatalogItem[] => colors.filter((c) => selectedColorIds.includes(c.id)),
    [colors, selectedColorIds],
  );
  const selectedSizes = useMemo(
    (): CatalogItem[] => sizes.filter((s) => selectedSizeIds.includes(s.id)),
    [sizes, selectedSizeIds],
  );

  const previewProducts = useMemo((): string[] => {
    if (!selectedType || !selectedName || !selectedFinish) return [];
    const products: string[] = [];
    for (const color of selectedColors) {
      for (const size of selectedSizes) {
        const parts = [
          selectedType.name,
          selectedName.name,
          selectedFinish.name,
          color.name,
        ];
        if (size.name !== 'Talle Unico') parts.push(size.name);
        const sku = [
          selectedType.skuCode,
          selectedName.skuCode,
          selectedFinish.skuCode,
          color.skuCode,
          size.skuCode,
        ].join('.');
        products.push(`${parts.join(' ')} (SKU: ${sku})`);
      }
    }
    return products;
  }, [
    selectedType,
    selectedName,
    selectedFinish,
    selectedColors,
    selectedSizes,
  ]);

  function handleClose(): void {
    onOpenChange(false);
    setStep(0);
    setSelectedColorIds([]);
    setSelectedSizeIds([]);
    reset();
  }

  function toggleColor(colorId: string): void {
    setSelectedColorIds((prev) =>
      prev.includes(colorId)
        ? prev.filter((id) => id !== colorId)
        : [...prev, colorId],
    );
  }

  function toggleSize(sizeId: string): void {
    setSelectedSizeIds((prev) =>
      prev.includes(sizeId)
        ? prev.filter((id) => id !== sizeId)
        : [...prev, sizeId],
    );
  }

  async function handleNext(): Promise<void> {
    if (step === 0) {
      const valid = await trigger();
      if (!valid) return;
    }
    if (step === 1 && selectedColorIds.length === 0) {
      toast.error('Selecciona al menos un color');
      return;
    }
    if (step === 2 && selectedSizeIds.length === 0) {
      toast.error('Selecciona al menos un talle');
      return;
    }
    setStep((prev) => prev + 1);
  }

  function handleBack(): void {
    setStep((prev) => prev - 1);
  }

  async function handleSubmit(): Promise<void> {
    setIsSubmitting(true);
    try {
      const res = await apiClientFetch<{ data: unknown[] }>(
        '/api/products/batch',
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            typeId,
            nameId,
            finishId,
            colorIds: selectedColorIds,
            sizeIds: selectedSizeIds,
          }),
        },
      );
      toast.success(`${res.data.length} productos creados`);
      handleClose();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear productos',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Crear productos</DialogTitle>
          <p className='text-muted-foreground text-sm'>
            Paso {step + 1} de {STEP_LABELS.length}: {STEP_LABELS[step]}
          </p>
        </DialogHeader>

        <div className='min-h-[200px] space-y-4'>
          {step === 0 && (
            <>
              <div className='space-y-2'>
                <Label>
                  Tipo <span className='text-destructive'>*</span>
                </Label>
                <Select
                  value={typeId || undefined}
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

              <div className='space-y-2'>
                <Label>
                  Nombre <span className='text-destructive'>*</span>
                </Label>
                <Select
                  value={nameId || undefined}
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
                  value={finishId || undefined}
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
            </>
          )}

          {step === 1 && (
            <div className='space-y-3'>
              <p className='text-sm'>
                Selecciona los colores para crear productos:
              </p>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
                {colors.map((color) => (
                  <label
                    key={color.id}
                    className='hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors'
                  >
                    <Checkbox
                      checked={selectedColorIds.includes(color.id)}
                      onCheckedChange={() => toggleColor(color.id)}
                    />
                    <span className='text-sm'>{color.name}</span>
                  </label>
                ))}
              </div>
              {selectedColorIds.length > 0 && (
                <p className='text-muted-foreground text-xs'>
                  {selectedColorIds.length} color
                  {selectedColorIds.length !== 1 ? 'es' : ''} seleccionado
                  {selectedColorIds.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className='space-y-3'>
              <p className='text-sm'>
                Selecciona los talles para crear productos:
              </p>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
                {sizes.map((size) => (
                  <label
                    key={size.id}
                    className='hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors'
                  >
                    <Checkbox
                      checked={selectedSizeIds.includes(size.id)}
                      onCheckedChange={() => toggleSize(size.id)}
                    />
                    <span className='text-sm'>{size.name}</span>
                  </label>
                ))}
              </div>
              {selectedSizeIds.length > 0 && (
                <p className='text-muted-foreground text-xs'>
                  {selectedSizeIds.length} talle
                  {selectedSizeIds.length !== 1 ? 's' : ''} seleccionado
                  {selectedSizeIds.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className='space-y-3'>
              <p className='text-sm'>
                Se crearan <strong>{previewProducts.length}</strong> productos:
              </p>
              <div className='max-h-[250px] space-y-1 overflow-y-auto rounded-md border p-3'>
                {previewProducts.map((name) => (
                  <p key={name} className='text-sm'>
                    {name}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='flex justify-between'>
          <div className='flex gap-2'>
            {step > 0 && (
              <Button
                type='button'
                variant='outline'
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ChevronLeft className='mr-1 size-4' />
                Anterior
              </Button>
            )}
          </div>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            {step < 3 ? (
              <Button type='button' onClick={() => void handleNext()}>
                Siguiente
                <ChevronRight className='ml-1 size-4' />
              </Button>
            ) : (
              <Button
                type='button'
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className='mr-2 size-4 animate-spin' />
                )}
                Crear {previewProducts.length} productos
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
