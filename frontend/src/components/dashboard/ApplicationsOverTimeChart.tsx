import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { StatsOverview } from "../../types";
import { CHART_CHROME, SEQUENTIAL_BLUE } from "../../lib/chartColors";
import { EmptyState } from "../ui/States";

export function ApplicationsOverTimeChart({ stats }: { stats: StatsOverview }) {
  const data = stats.applications_over_time.map((point) => ({
    date: new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count: point.count,
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">Applications over time</h3>
      {data.length === 0 ? (
        <EmptyState title="No applications in this window yet" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="appliedTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SEQUENTIAL_BLUE} stopOpacity={0.15} />
                <stop offset="100%" stopColor={SEQUENTIAL_BLUE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={CHART_CHROME.grid} />
            <XAxis
              dataKey="date"
              tick={{ fill: CHART_CHROME.axis, fontSize: 12 }}
              axisLine={{ stroke: CHART_CHROME.grid }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: CHART_CHROME.axis, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: CHART_CHROME.grid }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={SEQUENTIAL_BLUE}
              strokeWidth={2}
              fill="url(#appliedTrend)"
              dot={{ r: 3, fill: SEQUENTIAL_BLUE, stroke: "#fcfcfb", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
