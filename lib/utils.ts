import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarHora(dataStr: string): string {
  try {
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  } catch {
    return '';
  }
}

export function formatarData(dataStr: string): string {
  try {
    const d = new Date(dataStr + 'T12:00:00Z');
    if (isNaN(d.getTime())) return dataStr;
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'America/Sao_Paulo',
    });
  } catch {
    return dataStr;
  }
}

export function formatarDataCompleta(dataStr: string): string {
  try {
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return dataStr;
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  } catch {
    return dataStr;
  }
}

export function formatarDataCurta(dataStr: string): string {
  try {
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return dataStr;
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' });
  } catch {
    return dataStr;
  }
}
