import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Agente Analista ⚽',
  description: 'Análise esportiva com odds justas, estatísticas e IA especialista',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark h-full">
      <body className={`${outfit.variable} ${plusJakarta.variable} h-full antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
