'use client';

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
      <div className="h-0.5 w-full bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent" />
      <div className="p-3.5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-6 bg-zinc-800 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-zinc-800 rounded w-3/4" />
            <div className="h-3 bg-zinc-800 rounded w-1/2" />
          </div>
        </div>
        {Array.from({ length: Math.max(0, lines - 1) }).map((_, i) => (
          <div key={i} className="h-3 bg-zinc-800 rounded" style={{ width: `${60 + i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent" />
        <div className="p-5 space-y-4">
          <div className="h-3 bg-zinc-800 rounded w-1/4" />
          <div className="flex justify-center gap-10 py-5">
            <div className="space-y-2">
              <div className="h-5 bg-zinc-800 rounded w-24" />
              <div className="h-4 bg-zinc-800 rounded w-16 mx-auto" />
            </div>
            <div className="h-12 w-12 bg-zinc-800 rounded-full" />
            <div className="space-y-2">
              <div className="h-5 bg-zinc-800 rounded w-24" />
              <div className="h-4 bg-zinc-800 rounded w-16 mx-auto" />
            </div>
          </div>
          <div className="h-3 bg-zinc-800 rounded w-1/2 mx-auto" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent" />
          <div className="p-5 space-y-3">
            <div className="h-3 bg-zinc-800 rounded w-1/3" />
            <div className="h-3 bg-zinc-800 rounded w-1/2" />
            <div className="h-3 bg-zinc-800 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonLista() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-zinc-800 rounded-lg" />
        <div className="w-32 h-10 bg-zinc-800 rounded-lg" />
      </div>
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-16 bg-zinc-800 rounded-lg" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
