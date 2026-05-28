'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiClientFetch } from '@/lib/api-client';
import { cleanSupplierData } from '@/lib/suppliers';
import {
  SupplierForm,
  type SupplierFormData,
} from '@/components/suppliers/SupplierForm';

export default function NuevoProveedorPage(): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: SupplierFormData): Promise<void> {
    setIsLoading(true);
    try {
      await apiClientFetch('/api/suppliers', token, {
        method: 'POST',
        body: JSON.stringify(cleanSupplierData(data)),
      });
      toast.success('Proveedor creado');
      router.push('/proveedores');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear proveedor',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className='space-y-6'>
      <Button variant='ghost' size='sm' asChild>
        <Link href='/proveedores'>
          <ArrowLeft className='mr-1 size-4' />
          Volver
        </Link>
      </Button>

      <SupplierForm
        title='Nuevo Proveedor'
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
