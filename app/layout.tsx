import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="pt-BR" className={cn("h-full", "font-sans", geist.variable)}>
      <body className={`${inter.variable} h-full bg-[#f3f4f6] text-[#111827] antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
