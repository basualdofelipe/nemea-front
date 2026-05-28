import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseSession = jest.fn(() => ({
  data: {
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'demo@nemea.com',
      permissions: { canUseCalculator: true },
    },
    accessToken: 'fake-token',
  },
  status: 'authenticated' as const,
}));

jest.mock('next-auth/react', () => ({
  useSession: (): unknown => mockUseSession(),
}));

jest.mock('next/navigation', () => ({
  useRouter: (): { refresh: jest.Mock } => ({ refresh: jest.fn() }),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/components/calculadora/GatewaySelectors', () => ({
  GatewaySelectors: ({
    onConfigChange,
  }: {
    onConfigChange: (c: unknown) => void;
  }) => (
    <button
      onClick={() =>
        onConfigChange({
          gatewaySlug: 'pago_nube',
          paymentMethod: 'tarjeta_debito_credito',
          withdrawalDays: 1,
          installments: 1,
          planSlug: 'esencial',
        })
      }
    >
      Set Gateway
    </button>
  ),
}));

const PRODUCT_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

jest.mock('@/components/calculadora/ProductSelector', () => ({
  ProductSelector: ({
    onProductSelect,
  }: {
    onProductSelect: (p: unknown) => void;
  }) => (
    <button
      onClick={() =>
        onProductSelect({
          id: PRODUCT_UUID,
          skuCode: 'T.N.F.C.S',
          currentPrice: '100',
          isActive: true,
        })
      }
    >
      Select Product
    </button>
  ),
}));

jest.mock('@/components/calculadora/ModeToggle', () => ({
  ModeToggle: ({ onModeChange }: { onModeChange: (m: string) => void }) => (
    <button onClick={() => onModeChange('inverse')}>Toggle Mode</button>
  ),
}));

jest.mock('@/components/calculadora/DesglosePanel', () => ({
  DesglosePanel: () => <div data-testid='desglose'>Desglose Panel</div>,
}));

import { CalculadoraClient } from '../CalculadoraClient';

const GATEWAY_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const PLAN_UUID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

const mockProducts = [
  {
    id: PRODUCT_UUID,
    skuCode: 'T.N.F.C.S',
    currentPrice: '100',
    isActive: true,
    name: { name: 'Test' },
    type: { name: 'Tipo' },
    finish: { name: 'Lisa' },
    color: { name: 'Marrón' },
    size: { name: 'S' },
    cost: 60,
  },
];

const mockConfig = {
  gateways: [
    { id: GATEWAY_UUID, slug: 'pago_nube', label: 'Pago Nube', isActive: true },
  ],
  rates: [],
  installments: [],
  taxConfig: null,
  plans: [{ id: PLAN_UUID, slug: 'esencial', label: 'Esencial' }],
};

describe('CalculadoraClient', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': '100' }),
        json: () =>
          Promise.resolve({
            data: { ganancia: 30, margen: 0.3, precioVenta: 130, costo: 60 },
          }),
      }),
    ) as jest.Mock;
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '11111111-1111-4111-8111-111111111111',
          email: 'demo@nemea.com',
          permissions: { canUseCalculator: true },
        },
        accessToken: 'fake-token',
      },
      status: 'authenticated' as const,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('forward mode: calls /api/calculadora/forward and renders DesglosePanel after selecting product + gateway + price', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <CalculadoraClient
        products={mockProducts as never}
        config={mockConfig as never}
      />,
    );

    // Select product
    await user.click(screen.getByText('Select Product'));
    // Set gateway config
    await user.click(screen.getByText('Set Gateway'));

    // In forward mode, there are two inputs with placeholder '0':
    // "Precio de venta" and "Costo de envio". Get all and use the first.
    const allInputs = screen.getAllByPlaceholderText('0');
    const priceInput = allInputs[0]; // Precio de venta is first
    await user.type(priceInput, '130');

    // Advance timers to trigger debounce
    jest.runAllTimers();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/calculadora/forward'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('desglose')).toBeInTheDocument();
    });
  });

  it('inverse mode: calls /api/calculadora/inverse after toggling mode + entering ganancia', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <CalculadoraClient
        products={mockProducts as never}
        config={mockConfig as never}
      />,
    );

    // Select product
    await user.click(screen.getByText('Select Product'));
    // Set gateway config
    await user.click(screen.getByText('Set Gateway'));
    // Toggle to inverse mode
    await user.click(screen.getByText('Toggle Mode'));

    // In inverse mode there are two inputs: "Ganancia deseada" and "Costo de envio"
    const allInputs = screen.getAllByPlaceholderText('0');
    const gainInput = allInputs[0]; // Ganancia deseada is first
    await user.type(gainInput, '50');

    // Advance timers to trigger debounce
    jest.runAllTimers();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/calculadora/inverse'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('debounce: rapid input changes trigger only one fetch', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <CalculadoraClient
        products={mockProducts as never}
        config={mockConfig as never}
      />,
    );

    // Select product and gateway first
    await user.click(screen.getByText('Select Product'));
    await user.click(screen.getByText('Set Gateway'));

    // Clear any previous fetch calls
    (global.fetch as jest.Mock).mockClear();

    // Type rapidly — multiple chars trigger multiple useEffect calls
    const allInputs = screen.getAllByPlaceholderText('0');
    const priceInput = allInputs[0]; // Precio de venta is first
    await user.type(priceInput, '999');

    // Before runAllTimers, fetch should not have been called yet (debounce pending)
    // Advance all timers to flush debounce
    jest.runAllTimers();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
