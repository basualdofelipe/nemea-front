'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiClientFetch } from '@/lib/api-client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import type { TiendanubeConfigAll } from '@/components/tiendanube-config/types';
import type { Scenario } from '@/components/scenarios/types';
import { ScenarioCard } from '@/components/scenarios/ScenarioCard';
import { CreateScenarioDialog } from '@/components/scenarios/CreateScenarioDialog';

interface ScenarioListClientProps {
  initialScenarios: Scenario[];
  config: TiendanubeConfigAll;
}

export function ScenarioListClient({
  initialScenarios,
  config,
}: ScenarioListClientProps): ReactElement {
  const { data: session } = useSession();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>(initialScenarios);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<Scenario | null>(null);

  const currentUserId = session?.user?.id;
  const token = session?.accessToken ?? '';
  const isAdmin = useIsAdmin();

  const ownScenarios = scenarios.filter((s) => s.user.id === currentUserId);
  const sharedScenarios = scenarios.filter((s) => s.user.id !== currentUserId);

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;
    try {
      await apiClientFetch(`/api/scenarios/${deleteTarget.id}`, token, {
        method: 'DELETE',
      });
      setScenarios((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success('Escenario eliminado');
    } catch {
      toast.error('Error al eliminar el escenario');
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleTogglePublic(scenarioId: string): Promise<void> {
    try {
      const res = await apiClientFetch<{ data: Scenario }>(
        `/api/scenarios/${scenarioId}/toggle-public`,
        token,
        { method: 'PATCH' },
      );
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === scenarioId ? { ...s, isPublic: res.data.isPublic } : s,
        ),
      );
      toast.success(
        res.data.isPublic
          ? 'Escenario compartido con inversores'
          : 'Escenario ahora es privado',
      );
    } catch {
      toast.error('Error al cambiar la visibilidad del escenario');
    }
  }

  function handleCreated(scenario: Scenario): void {
    setScenarios((prev) => [scenario, ...prev]);
    router.push(`/escenarios/${scenario.id}`);
  }

  if (scenarios.length === 0) {
    return (
      <>
        <div className='flex flex-col items-center justify-center py-12'>
          <h2 className='text-lg font-semibold'>No tenes escenarios</h2>
          <p className='text-muted-foreground mt-1 text-sm'>
            Crea un escenario para simular cambios de precios y ver como
            impactan tus margenes.
          </p>
          <Button className='mt-4' onClick={() => setCreateDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Crear tu primer escenario
          </Button>
        </div>
        <CreateScenarioDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreated={handleCreated}
          config={config}
        />
      </>
    );
  }

  return (
    <>
      <div className='flex items-center justify-end'>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Crear escenario
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {ownScenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isOwner={true}
            canDelete={true}
            onDelete={() => setDeleteTarget(scenario)}
            onTogglePublic={() => handleTogglePublic(scenario.id)}
          />
        ))}
      </div>

      {sharedScenarios.length > 0 && (
        <>
          <Separator />
          <div className='space-y-4'>
            <h2 className='text-muted-foreground text-sm font-semibold'>
              Escenarios compartidos
            </h2>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {sharedScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  isOwner={false}
                  canDelete={isAdmin}
                  onDelete={() => setDeleteTarget(scenario)}
                  onTogglePublic={() => {}}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <CreateScenarioDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleCreated}
        config={config}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar escenario</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara &quot;{deleteTarget?.name}&quot; y todos sus
              overrides de precios. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No eliminar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Eliminar escenario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
