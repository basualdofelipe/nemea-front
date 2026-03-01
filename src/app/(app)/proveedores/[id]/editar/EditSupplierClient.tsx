'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { apiClientFetch } from '@/lib/api-client';
import {
  SupplierForm,
  type SupplierFormData,
} from '@/components/suppliers/SupplierForm';

interface Supplier {
  id: string;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  isActive: boolean;
}

interface EditSupplierClientProps {
  supplier: Supplier;
}

export function EditSupplierClient({
  supplier,
}: EditSupplierClientProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues: SupplierFormData = {
    name: supplier.name,
    address: supplier.address ?? '',
    email: supplier.email ?? '',
    phone: supplier.phone ?? '',
    whatsapp: supplier.whatsapp ?? '',
    description: supplier.description ?? '',
  };

  async function handleSubmit(data: SupplierFormData): Promise<void> {
    setIsLoading(true);
    try {
      await apiClientFetch(`/api/suppliers/${supplier.id}`, token, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      toast.success('Proveedor actualizado');
      router.push('/proveedores');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al actualizar proveedor',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SupplierForm
      title='Editar Proveedor'
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}
