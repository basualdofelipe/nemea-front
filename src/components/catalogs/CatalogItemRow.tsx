'use client';

import type { ReactElement, KeyboardEvent } from 'react';
import { useState } from 'react';
import { Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CatalogItemRowProps {
  item: { id: string; name: string };
  canEdit: boolean;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CatalogItemRow({
  item,
  canEdit,
  onUpdate,
  onDelete,
}: CatalogItemRowProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.name);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSave(): Promise<void> {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === item.name) {
      setIsEditing(false);
      setEditValue(item.name);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(item.id, trimmed);
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel(): void {
    setIsEditing(false);
    setEditValue(item.name);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') {
      void handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }

  async function handleDelete(): Promise<void> {
    setIsLoading(true);
    try {
      await onDelete(item.id);
    } finally {
      setIsLoading(false);
    }
  }

  if (isEditing) {
    return (
      <div className='border-border flex items-center gap-2 border-b px-2 py-1.5'>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className='h-8 flex-1'
          autoFocus
        />
        <Button
          size='icon'
          variant='ghost'
          onClick={() => void handleSave()}
          disabled={isLoading || !editValue.trim()}
          className='size-8'
        >
          {isLoading ? (
            <Loader2 className='size-4 animate-spin' />
          ) : (
            <Check className='size-4' />
          )}
        </Button>
        <Button
          size='icon'
          variant='ghost'
          onClick={handleCancel}
          disabled={isLoading}
          className='size-8'
        >
          <X className='size-4' />
        </Button>
      </div>
    );
  }

  return (
    <div className='border-border hover:bg-muted/50 group flex items-center justify-between border-b px-2 py-2'>
      <span className='text-sm'>{item.name}</span>
      {canEdit && (
        <div className='flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100'>
          <Button
            size='icon'
            variant='ghost'
            onClick={() => {
              setEditValue(item.name);
              setIsEditing(true);
            }}
            disabled={isLoading}
            className='size-7'
          >
            <Pencil className='size-3.5' />
          </Button>
          <Button
            size='icon'
            variant='ghost'
            onClick={() => void handleDelete()}
            disabled={isLoading}
            className='size-7'
          >
            {isLoading ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <Trash2 className='size-3.5' />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
