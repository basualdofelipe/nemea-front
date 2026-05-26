// jest.mock MUST appear before component imports (hoisted but explicit placement is safer)
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('next/link', () => {
  const Link = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }): React.ReactElement => <a href={href}>{children as React.ReactElement}</a>;
  Link.displayName = 'Link';
  return Link;
});

import { render, screen } from '@testing-library/react';
import { auth } from '@/auth';
import Home from '../page';

// NextAuth's `auth` is an overloaded callable (handler + middleware), so
// jest.MockedFunction collapses its param to `never`. Cast to a plain mock.
const mockAuth = auth as unknown as jest.Mock;

describe('Home page', () => {
  it('renders permission cards for admin user', async () => {
    mockAuth.mockResolvedValue({
      user: {
        permissions: {
          canViewProducts: true,
          canUseCalculator: true,
          canViewSupplies: true,
          canViewExpenses: true,
        },
      },
    });

    render(await Home());

    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Calculadora')).toBeInTheDocument();
    expect(screen.getByText('Insumos')).toBeInTheDocument();
    expect(screen.getByText('Gastos')).toBeInTheDocument();
  });

  it('renders empty state when no permissions granted', async () => {
    mockAuth.mockResolvedValue({
      user: {
        permissions: {
          canViewProducts: false,
          canUseCalculator: false,
          canViewSupplies: false,
          canViewExpenses: false,
        },
      },
    });

    render(await Home());

    expect(
      screen.getByText(/No tenés acceso a ninguna sección/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Productos')).not.toBeInTheDocument();
  });

  it('renders only permitted cards when partial permissions', async () => {
    mockAuth.mockResolvedValue({
      user: {
        permissions: {
          canViewProducts: true,
          canUseCalculator: false,
          canViewSupplies: false,
          canViewExpenses: false,
        },
      },
    });

    render(await Home());

    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.queryByText('Calculadora')).not.toBeInTheDocument();
  });
});
