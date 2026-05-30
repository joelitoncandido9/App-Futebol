import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
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
      <body className={`${inter.variable} h-full antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
