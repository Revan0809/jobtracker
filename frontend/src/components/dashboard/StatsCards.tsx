import type { StatsOverview } from "../../types";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function StatsCards({ stats }: { stats: StatsOverview }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatTile label="Total applied" value={stats.total_applications.toLocaleString()} />
      <StatTile label="Interview rate" value={`${stats.interview_rate}%`} />
      <StatTile label="Offer rate" value={`${stats.offer_rate}%`} />
    </div>
  );
}
