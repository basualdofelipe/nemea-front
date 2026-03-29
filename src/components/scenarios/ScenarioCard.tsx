'use client';

import type { ReactElement } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Scenario } from './types';

interface ScenarioCardProps {
  scenario: Scenario;
  isOwner: boolean;
  onDelete: () => void;
  onTogglePublic: () => void;
}

function formatGateway(slug: string | null): string {
  if (!slug) return 'Sin pasarela';
  return slug.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ScenarioCard({
  scenario,
  isOwner,
  onDelete,
  onTogglePublic,
}: ScenarioCardProps): ReactElement {
  const overrideCount = scenario.overrides?.length ?? 0;

  return (
    <Card>
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between gap-2'>
          <CardTitle className='text-base'>
            <Link
              href={`/escenarios/${scenario.id}`}
              className='text-primary font-semibold hover:underline'
            >
              {scenario.name}
            </Link>
          </CardTitle>
          <div className='flex items-center gap-1'>
            {isOwner && scenario.isPublic && (
              <Badge variant='secondary'>Publico</Badge>
            )}
            {!isOwner && (
              <Badge variant='outline'>
                (compartido por {scenario.user.name ?? scenario.user.email})
              </Badge>
            )}
            {isOwner && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={onDelete}
                    aria-label={`Eliminar escenario ${scenario.name}`}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eliminar escenario</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
          <span>Creado {formatDate(scenario.createdAt)}</span>
          <span className='text-muted-foreground/50'>|</span>
          <span>{overrideCount} productos</span>
          <span className='text-muted-foreground/50'>|</span>
          <span>{formatGateway(scenario.gatewaySlug)}</span>
        </div>
        <div className='flex items-center justify-between'>
          <div>
            {isOwner ? (
              <Button variant='outline' size='sm' asChild>
                <Link href={`/escenarios/${scenario.id}`}>
                  Editar escenario
                </Link>
              </Button>
            ) : (
              <Button variant='outline' size='sm' asChild>
                <Link href={`/escenarios/${scenario.id}`}>Ver escenario</Link>
              </Button>
            )}
          </div>
          {isOwner && (
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground text-sm'>Compartir</span>
              <Switch
                checked={scenario.isPublic}
                onCheckedChange={onTogglePublic}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
