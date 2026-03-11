import { render, screen } from '@testing-library/react';
import Home from '../page';

jest.mock('next-themes', () => ({
  useTheme: (): { theme: string; setTheme: jest.Mock } => ({
    theme: 'dark',
    setTheme: jest.fn(),
  }),
}));

describe('Home page', () => {
  it('renders the NEMEA heading', () => {
    render(<Home />);
    const heading = screen.getByText('NEMEA');
    expect(heading).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<Home />);
    const subtitle = screen.getByText('Gestion y pricing para marroquineria');
    expect(subtitle).toBeInTheDocument();
  });
});
