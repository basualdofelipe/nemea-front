import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';
import localFont from 'next/font/local';
import { Poppins, JetBrains_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import './globals.css';

const engravingCC = localFont({
  src: '../../public/fonts/EngravingCC.ttf',
  display: 'swap',
  variable: '--font-display',
});

const engravingShaded = localFont({
  src: '../../public/fonts/EngravingShadedCC.ttf',
  display: 'swap',
  variable: '--font-display-shaded',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-poppins',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'Nemea',
  description: 'Gestion y pricing para marroquineria',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return (
    <html
      lang='es'
      suppressHydrationWarning
      className={`${engravingCC.variable} ${engravingShaded.variable} ${poppins.variable} ${jetbrainsMono.variable}`}
    >
      <body className='font-sans antialiased'>
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
