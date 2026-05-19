import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent, {
  PointerEventsCheckLevel,
} from '@testing-library/user-event';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'caller-uuid',
        email: 'admin@nemea.com',
        permissions: { canManageUsers: true },
      },
      accessToken: 'fake-token',
    },
    status: 'authenticated',
  })),
}));

jest.mock('next/navigation', () => ({
  useRouter: (): { refresh: jest.Mock } => ({ refresh: jest.fn() }),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { toast } from 'sonner';
import { DeleteUserAlertDialog } from '../DeleteUserAlertDialog';

const VICTIM_ID = '11111111-1111-4111-8111-111111111111';
const EDITOR_ROLE_ID = '22222222-2222-4222-8222-222222222222';

const mockUser = {
  id: VICTIM_ID,
  email: 'user@nemea.com',
  name: 'Juan',
  role: { id: EDITOR_ROLE_ID, name: 'EDITOR' },
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('DeleteUserAlertDialog', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
      }),
    ) as jest.Mock;
    jest.clearAllMocks();
  });

  it('renders rename preview copy with email and name', () => {
    render(
      <DeleteUserAlertDialog
        user={mockUser}
        open={true}
        onOpenChange={jest.fn()}
        onSuccess={jest.fn()}
      />,
    );
    expect(screen.getByText(/Eliminar usuario/i)).toBeInTheDocument();
    expect(screen.getByText('user@nemea.com')).toBeInTheDocument();
    expect(screen.getByText(/Juan/)).toBeInTheDocument();
    expect(screen.getByText(/transferidos/i)).toBeInTheDocument();
  });

  it('shows "usuario borrado" fallback when name is null', () => {
    render(
      <DeleteUserAlertDialog
        user={{ ...mockUser, name: null }}
        open={true}
        onOpenChange={jest.fn()}
        onSuccess={jest.fn()}
      />,
    );
    expect(screen.getByText(/usuario borrado/)).toBeInTheDocument();
  });

  it('confirms calls DELETE and triggers onSuccess', async () => {
    const onSuccess = jest.fn();
    render(
      <DeleteUserAlertDialog
        user={mockUser}
        open={true}
        onOpenChange={jest.fn()}
        onSuccess={onSuccess}
      />,
    );

    const confirmBtn = screen.getByRole('button', { name: /Borrar usuario/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/users/${VICTIM_ID}`),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Usuario eliminado');
  });

  it('cancel does not fire DELETE', async () => {
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    render(
      <DeleteUserAlertDialog
        user={mockUser}
        open={true}
        onOpenChange={jest.fn()}
        onSuccess={jest.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Cancelar/i }));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('shows backend error message via toast.error on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          message: 'No se puede dejar el sistema sin administradores activos',
        }),
    });

    const onSuccess = jest.fn();
    render(
      <DeleteUserAlertDialog
        user={mockUser}
        open={true}
        onOpenChange={jest.fn()}
        onSuccess={onSuccess}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Borrar usuario/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'No se puede dejar el sistema sin administradores activos',
      );
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
