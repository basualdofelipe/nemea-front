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
import { EditUserDialog } from '../EditUserDialog';

const VICTIM_ID = '11111111-1111-4111-8111-111111111111';
const EDITOR_ROLE_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_ROLE_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_USER_ID = '44444444-4444-4444-8444-444444444444';

const mockUser = {
  id: VICTIM_ID,
  email: 'user@nemea.com',
  name: 'Juan',
  role: { id: EDITOR_ROLE_ID, name: 'EDITOR' },
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockRoles = [
  { id: EDITOR_ROLE_ID, name: 'EDITOR' },
  { id: ADMIN_ROLE_ID, name: 'ADMIN' },
];

describe('EditUserDialog', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: { ...mockUser, name: 'Nuevo' } }),
      }),
    ) as jest.Mock;
    jest.clearAllMocks();
  });

  it('renders prefilled with current values', () => {
    render(
      <EditUserDialog
        user={mockUser}
        open={true}
        onOpenChange={jest.fn()}
        roles={mockRoles}
        isOwnRow={false}
        onSuccess={jest.fn()}
      />,
    );
    expect(screen.getByDisplayValue('user@nemea.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
  });

  it('disables Role and Active on own row, keeps Name editable', () => {
    render(
      <EditUserDialog
        user={mockUser}
        open={true}
        onOpenChange={jest.fn()}
        roles={mockRoles}
        isOwnRow={true}
        onSuccess={jest.fn()}
      />,
    );
    // Name editable
    const nameInput = screen.getByLabelText(/Nombre/i);
    expect(nameInput).not.toBeDisabled();

    // Switch disabled (Radix Switch renders role='switch')
    const switchEl = screen.getByRole('switch');
    expect(switchEl).toBeDisabled();

    // Role Select: Radix SelectTrigger renders role='combobox', disabled attribute is on the button
    const roleTrigger = screen.getByRole('combobox');
    expect(roleTrigger).toBeDisabled();
  });

  it('submits PATCH and triggers onSuccess on success', async () => {
    const onSuccess = jest.fn();
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    render(
      <EditUserDialog
        user={mockUser}
        open={true}
        onOpenChange={jest.fn()}
        roles={mockRoles}
        isOwnRow={false}
        onSuccess={onSuccess}
      />,
    );

    // Wait for useEffect-driven reset to populate prefilled values before
    // interacting with the form (otherwise zod roleId UUID check rejects '').
    await waitFor(() => {
      expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Nombre/i) as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, 'Nuevo');

    const saveBtn = screen.getByRole('button', { name: /Guardar/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/users/${VICTIM_ID}`),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Usuario actualizado');
  });

  it('shows backend error message via toast.error on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({ message: 'No puedes cambiar tu propio rol' }),
    });

    const onSuccess = jest.fn();
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    render(
      <EditUserDialog
        user={mockUser}
        open={true}
        onOpenChange={jest.fn()}
        roles={mockRoles}
        isOwnRow={false}
        onSuccess={onSuccess}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
    });

    // Change name so dto has content (forces backend call)
    const nameInput = screen.getByLabelText(/Nombre/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Otro');

    await user.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'No puedes cambiar tu propio rol',
      );
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('resets form when user prop changes', async () => {
    const { rerender } = render(
      <EditUserDialog
        user={mockUser}
        open={true}
        onOpenChange={jest.fn()}
        roles={mockRoles}
        isOwnRow={false}
        onSuccess={jest.fn()}
      />,
    );

    expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();

    const otherUser = {
      id: OTHER_USER_ID,
      email: 'other@nemea.com',
      name: 'Maria',
      role: { id: ADMIN_ROLE_ID, name: 'ADMIN' },
      isActive: false,
      createdAt: '2026-02-01T00:00:00.000Z',
    };

    rerender(
      <EditUserDialog
        user={otherUser}
        open={true}
        onOpenChange={jest.fn()}
        roles={mockRoles}
        isOwnRow={false}
        onSuccess={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Maria')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('other@nemea.com')).toBeInTheDocument();
  });
});
