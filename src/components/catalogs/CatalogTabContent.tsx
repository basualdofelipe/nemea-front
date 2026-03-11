'use client';

import type { ReactElement, KeyboardEvent } from 'react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClientFetch } from '@/lib/api-client';
import { CatalogItemRow } from '@/components/catalogs/CatalogItemRow';

interface CatalogItem {
  id: string;
  name: string;
}

interface CatalogResponse {
  data: CatalogItem;
}

interface CatalogTabContentProps {
  dimension: string;
  initialItems: CatalogItem[];
  isAdmin: boolean;
}

function sortByName(items: CatalogItem[]): CatalogItem[] {
  return [...items].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
  );
}

export function CatalogTabContent({
  dimension,
  initialItems,
  isAdmin,
}: CatalogTabContentProps): ReactElement {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [items, setItems] = useState<CatalogItem[]>(sortByName(initialItems));
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate(): Promise<void> {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setIsCreating(true);
    try {
      const response = await apiClientFetch<CatalogResponse>(
        `/api/catalogs/${dimension}`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({ name: trimmed }),
        },
      );
      setItems((prev) => sortByName([...prev, response.data]));
      setNewName('');
      setIsAdding(false);
      toast.success('Item creado');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear item',
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdate(id: string, name: string): Promise<void> {
    try {
      const response = await apiClientFetch<CatalogResponse>(
        `/api/catalogs/${dimension}/${id}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({ name }),
        },
      );
      setItems((prev) =>
        sortByName(prev.map((item) => (item.id === id ? response.data : item))),
      );
      toast.success('Item actualizado');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al actualizar item',
      );
      throw error;
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      await apiClientFetch(`/api/catalogs/${dimension}/${id}`, token, {
        method: 'DELETE',
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Item eliminado');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar item',
      );
      throw error;
    }
  }

  function handleNewKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      void handleCreate();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewName('');
    }
  }

  return (
    <div className='space-y-2'>
      {isAdmin && (
        <div className='mb-4'>
          {isAdding ? (
            <div className='flex items-center gap-2'>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleNewKeyDown}
                placeholder='Nombre del item...'
                disabled={isCreating}
                className='h-8 flex-1'
                autoFocus
              />
              <Button
                size='icon'
                variant='ghost'
                onClick={() => void handleCreate()}
                disabled={isCreating || !newName.trim()}
                className='size-8'
              >
                {isCreating ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <Check className='size-4' />
                )}
              </Button>
              <Button
                size='icon'
                variant='ghost'
                onClick={() => {
                  setIsAdding(false);
                  setNewName('');
                }}
                disabled={isCreating}
                className='size-8'
              >
                <X className='size-4' />
              </Button>
            </div>
          ) : (
            <Button
              variant='outline'
              size='sm'
              onClick={() => setIsAdding(true)}
            >
              <Plus className='mr-1 size-4' />
              Agregar
            </Button>
          )}
        </div>
      )}

      <div className='rounded-md border'>
        {items.length === 0 ? (
          <p className='text-muted-foreground p-4 text-center text-sm'>
            No hay items en este catalogo.
          </p>
        ) : (
          items.map((item) => (
            <CatalogItemRow
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
