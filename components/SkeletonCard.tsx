'use client';

const shimmer = 'bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 bg-[length:200%_100%] animate-shimmer';

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-3.5 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-6 rounded ${shimmer}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-3 rounded w-3/4 ${shimmer}`} />
            <div className={`h-3 rounded w-1/2 ${shimmer}`} />
          </div>
        </div>
        {Array.from({ length: Math.max(0, lines - 1) }).map((_, i) => (
          <div key={i} className={`h-3 rounded ${shimmer}`} style={{ width: `${60 + i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-3">
      <div className="glass-strong rounded-xl p-4 space-y-4">
        <div className={`h-3 rounded w-1/4 ${shimmer}`} />
        <div className="flex justify-center gap-10 py-5">
          <div className="space-y-2">
            <div className={`h-5 rounded w-24 ${shimmer}`} />
            <div className={`h-4 rounded w-16 mx-auto ${shimmer}`} />
          </div>
          <div className={`h-12 w-12 rounded-full ${shimmer}`} />
          <div className="space-y-2">
            <div className={`h-5 rounded w-24 ${shimmer}`} />
            <div className={`h-4 rounded w-16 mx-auto ${shimmer}`} />
          </div>
        </div>
        <div className={`h-3 rounded w-1/2 mx-auto ${shimmer}`} />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass rounded-xl p-4 space-y-3">
          <div className={`h-3 rounded w-1/3 ${shimmer}`} />
          <div className={`h-3 rounded w-1/2 ${shimmer}`} />
          <div className={`h-3 rounded w-2/3 ${shimmer}`} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonLista() {
  return (
    <div className="space-y-4">
      <div className={`h-10 rounded-xl ${shimmer}`} />
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`h-7 w-16 rounded-lg ${shimmer}`} />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
