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

export function traduzirFato(fato: string): string {
  if (!fato) return fato;

  fato = fato.replace(
    /(.+?) haven't won any of their last (\d+) games against (.+?)\./,
    (_, t1, n, t2) => `${t1} não venceu nenhum dos últimos ${n} jogos contra ${t2}.`
  );

  fato = fato.replace(
    /When playing at home, (.+?) have not lost to (.+?) in their last (\d+) encounters?\./,
    (_, t1, t2, n) => `Jogando em casa, ${t1} não perdeu para ${t2} nos últimos ${n} confrontos.`
  );

  fato = fato.replace(
    /(.+?) have won (\d+) of their last (\d+) games against (.+?)\./,
    (_, t1, wins, total, t2) => `${t1} venceu ${wins} dos últimos ${total} jogos contra ${t2}.`
  );

  fato = fato.replace(
    /(.+?) have lost (\d+) of their last (\d+) games against (.+?)\./,
    (_, t1, losses, total, t2) => `${t1} perdeu ${losses} dos últimos ${total} jogos contra ${t2}.`
  );

  fato = fato.replace(
    /When playing at home, (.+?) have won (\d+) of their last (\d+) games against (.+?)\./,
    (_, t1, wins, total, t2) => `Jogando em casa, ${t1} venceu ${wins} dos últimos ${total} jogos contra ${t2}.`
  );

  fato = fato.replace(
    /(.+?) have scored at least (\d+) goals in (\d+) of their last (\d+) games against (.+?)\./,
    (_, t1, goals, m, total, t2) => `${t1} marcou pelo menos ${goals} gols em ${m} dos últimos ${total} jogos contra ${t2}.`
  );

  fato = fato.replace(
    /(.+?) have kept a clean sheet in (\d+) of their last (\d+) games against (.+?)\./,
    (_, t1, clean, total, t2) => `${t1} não sofreu gols em ${clean} dos últimos ${total} jogos contra ${t2}.`
  );

  fato = fato.replace(
    /There have been under (\d+) goals? scored in (\d+) of (.+?)'s last (\d+) games against (.+?)\./,
    (_, goals, m, t1, total, t2) => `Houve menos de ${goals} gols em ${m} dos últimos ${total} jogos de ${t1} contra ${t2}.`
  );

  fato = fato.replace(
    /(.+?) have failed to score in (\d+) of their last (\d+) games against (.+?)\./,
    (_, t1, fails, total, t2) => `${t1} não marcou gols em ${fails} dos últimos ${total} jogos contra ${t2}.`
  );

  fato = fato.replace(
    /(.+?) has scored (\d+) goals? in his last (\d+) games against (.+?)\./,
    (_, player, goals, total, t2) => `${player} marcou ${goals} gols nos últimos ${total} jogos contra ${t2}.`
  );

  return fato;
}

export function traduzirForma(c: string): string {
  if (c === 'W') return 'V';
  if (c === 'D') return 'E';
  if (c === 'L') return 'D';
  return c;
}
