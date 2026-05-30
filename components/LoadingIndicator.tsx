'use client';

interface LoadingIndicatorProps {
  mensagem?: string;
}

export default function LoadingIndicator({ mensagem = 'Carregando...' }: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" />
      </div>
      <p className="text-zinc-400 text-sm">{mensagem}</p>
    </div>
  );
}
