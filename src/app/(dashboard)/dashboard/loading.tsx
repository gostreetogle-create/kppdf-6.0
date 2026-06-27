export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Title */}
      <div className="h-8 w-36 rounded-lg bg-[var(--muted)]" />

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-24 rounded bg-[var(--muted)]" />
              <div className="h-6 w-6 rounded bg-[var(--muted)]" />
            </div>
            <div className="h-8 w-16 rounded bg-[var(--muted)]" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
          >
            <div className="h-5 w-36 rounded bg-[var(--muted)] mb-6" />
            <div className="h-[250px] rounded bg-[var(--muted)]/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
