import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StatsOverview } from "../../types";
import { CHART_CHROME, statusColor } from "../../lib/chartColors";

export function StatusBreakdownChart({ stats }: { stats: StatsOverview }) {
  const data = [
    { status: "Applied", count: stats.status_breakdown.applied },
    { status: "Interview", count: stats.status_breakdown.interview },
    { status: "Offer", count: stats.status_breakdown.offer },
    { status: "Rejected", count: stats.status_breakdown.rejected },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">Status breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid horizontal={false} stroke={CHART_CHROME.grid} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: CHART_CHROME.axis, fontSize: 12 }}
            axisLine={{ stroke: CHART_CHROME.grid }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="status"
            tick={{ fill: CHART_CHROME.text, fontSize: 12 }}
            axisLine={{ stroke: CHART_CHROME.grid }}
            tickLine={false}
            width={70}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: CHART_CHROME.grid }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={statusColor(entry.status)} />
            ))}
            <LabelList dataKey="count" position="right" style={{ fill: CHART_CHROME.text, fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
