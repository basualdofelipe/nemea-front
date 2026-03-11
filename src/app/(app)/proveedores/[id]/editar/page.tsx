import type { ReactElement } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { EditSupplierClient } from './EditSupplierClient';

interface Supplier {
  id: string;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditarProveedorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarProveedorPage({
  params,
}: EditarProveedorPageProps): Promise<ReactElement> {
  const { id } = await params;
  const response = await apiFetch<{ data: Supplier }>(`/api/suppliers/${id}`);

  return (
    <div className='space-y-6'>
      <Button variant='ghost' size='sm' asChild>
        <Link href='/proveedores'>
          <ArrowLeft className='mr-1 size-4' />
          Volver
        </Link>
      </Button>

      <EditSupplierClient supplier={response.data} />
    </div>
  );
}
