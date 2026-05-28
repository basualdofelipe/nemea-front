'use client';

import type { ReactElement } from 'react';
import { useState, useDeferredValue } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Pencil, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiClientFetch } from '@/lib/api-client';

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

interface SupplierTableProps {
  initialSuppliers: Supplier[];
  canEdit: boolean;
}

export function SupplierTable({
  initialSuppliers,
  canEdit,
}: SupplierTableProps): ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(deferredSearch.toLowerCase()),
  );

  async function handleToggleStatus(supplier: Supplier): Promise<void> {
    try {
      const response = await apiClientFetch<{ data: Supplier }>(
        `/api/suppliers/${supplier.id}/toggle-status`,
        token,
        { method: 'PATCH' },
      );
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? response.data : s)),
      );
      toast.success(
        `Proveedor ${response.data.isActive ? 'activado' : 'desactivado'}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al cambiar estado del proveedor',
      );
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='relative max-w-sm flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            placeholder='Buscar proveedor...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>
        {canEdit && (
          <Button onClick={() => router.push('/proveedores/nuevo')}>
            <Plus className='mr-1 size-4' />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className='hidden md:table-cell'>Email</TableHead>
              <TableHead className='hidden md:table-cell'>Telefono</TableHead>
              <TableHead className='hidden lg:table-cell'>WhatsApp</TableHead>
              <TableHead>Estado</TableHead>
              {canEdit && <TableHead className='w-12' />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 6 : 5}
                  className='text-muted-foreground h-24 text-center'
                >
                  {search
                    ? 'No se encontraron proveedores.'
                    : 'No hay proveedores registrados.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className={supplier.isActive ? '' : 'opacity-50'}
                >
                  <TableCell className='font-semibold'>
                    {supplier.name}
                  </TableCell>
                  <TableCell className='hidden md:table-cell'>
                    {supplier.email ?? '-'}
                  </TableCell>
                  <TableCell className='hidden md:table-cell'>
                    {supplier.phone ?? '-'}
                  </TableCell>
                  <TableCell className='hidden lg:table-cell'>
                    {supplier.whatsapp ?? '-'}
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Switch
                        checked={supplier.isActive}
                        onCheckedChange={() =>
                          void handleToggleStatus(supplier)
                        }
                      />
                    ) : (
                      <Badge
                        variant={supplier.isActive ? 'default' : 'destructive'}
                      >
                        {supplier.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() =>
                          router.push(`/proveedores/${supplier.id}/editar`)
                        }
                        className='size-8'
                      >
                        <Pencil className='size-4' />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
