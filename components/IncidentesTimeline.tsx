'use client';

interface Incident {
  type: string;
  minute: number;
  player?: string;
  player_id?: number;
  is_home?: boolean;
  card_type?: string;
  player_in?: string;
  player_in_id?: number;
  player_out?: string;
  player_out_id?: number;
  sequence?: Array<{ x: number; y: number }>;
  decision?: string;
  confirmed?: boolean;
}

interface IncidentesTimelineProps {
  incidents: Incident[];
  timeCasa: string;
  timeFora: string;
}

export default function IncidentesTimeline({
  incidents,
  timeCasa,
  timeFora,
}: IncidentesTimelineProps) {
  if (!incidents || incidents.length === 0) return null;

  // Filtra apenas eventos relevantes para exibição
  const relevantes = incidents.filter(
    (inc) => inc.type === 'goal' || inc.type === 'card' || inc.type === 'substitution' || inc.type === 'varDecision' || inc.type === 'period'
  );

  if (relevantes.length === 0) return null;

  // Encontra o minuto máximo para escala
  const maxMinuto = Math.max(...relevantes.map((i) => i.minute), 90);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-4">
        ⚽ Cronologia da Partida
      </h3>

      <div className="space-y-1">
        {relevantes.map((inc, idx) => (
          <IncidenteRow key={idx} incident={inc} timeCasa={timeCasa} timeFora={timeFora} maxMinuto={maxMinuto} />
        ))}
      </div>
    </div>
  );
}

function IncidenteRow({
  incident,
  timeCasa,
  timeFora,
  maxMinuto,
}: {
  incident: Incident;
  timeCasa: string;
  timeFora: string;
  maxMinuto: number;
}) {
  const { type, minute, is_home } = incident;

  // Period markers (intervalo, fim de jogo)
  if (type === 'period') {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="w-16 text-right text-muted-foreground text-xs font-mono shrink-0">
          {minute}&apos;
        </div>
        <div className="flex-1 text-center">
          <span className="text-muted-foreground text-xs italic">
            {minute <= 45 ? '⏸️ Intervalo' : minute <= 90 ? '⏹️ Fim do 2º tempo' : '⏱️ Fim da prorrogação'}
          </span>
        </div>
        <div className="w-16 shrink-0" />
      </div>
    );
  }

  // Goals
  if (type === 'goal') {
    return (
      <div className={`flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors ${is_home ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className="w-16 text-right shrink-0">
          <span className="text-muted-foreground text-xs font-mono font-bold">{minute}&apos;</span>
        </div>
        <div className={`flex-1 ${is_home ? 'text-left' : 'text-right'}`}>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            is_home ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'
          }`}>
            <span>⚽</span>
            <span>{incident.player || 'Gol'}</span>
          </span>
        </div>
        <div className="w-16 shrink-0" />
      </div>
    );
  }

  // Cards
  if (type === 'card') {
    const emoji = incident.card_type === 'red' ? '🟥' : incident.card_type === 'yellowRed' ? '🟨🟥' : '🟨';
    return (
      <div className={`flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors ${is_home ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className="w-16 text-right shrink-0">
          <span className="text-muted-foreground text-xs font-mono">{minute}&apos;</span>
        </div>
        <div className={`flex-1 ${is_home ? 'text-left' : 'text-right'}`}>
          <span className="text-foreground/80 text-xs">
            <span className="mr-1">{emoji}</span>
            {incident.player}
          </span>
        </div>
        <div className="w-16 shrink-0" />
      </div>
    );
  }

  // Substitutions
  if (type === 'substitution') {
    return (
      <div className={`flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors ${is_home ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className="w-16 text-right shrink-0">
          <span className="text-muted-foreground text-xs font-mono">{minute}&apos;</span>
        </div>
        <div className={`flex-1 ${is_home ? 'text-left' : 'text-right'}`}>
          <div className="inline-flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">🔄</span>
            <span className="text-green-400">{incident.player_in}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-red-400">{incident.player_out}</span>
          </div>
        </div>
        <div className="w-16 shrink-0" />
      </div>
    );
  }

  // VAR decisions
  if (type === 'varDecision') {
    return (
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors justify-center">
        <span className="text-xs text-muted-foreground">
          <span className="mr-1">📺</span>
          VAR: {incident.decision || 'Decisão'} {incident.confirmed ? '✅' : '❌'}
        </span>
      </div>
    );
  }

  return null;
}
