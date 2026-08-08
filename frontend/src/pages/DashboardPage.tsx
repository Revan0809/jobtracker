import { useStats } from "../hooks/useStats";
import { StatsCards } from "../components/dashboard/StatsCards";
import { StatusBreakdownChart } from "../components/dashboard/StatusBreakdownChart";
import { ApplicationsOverTimeChart } from "../components/dashboard/ApplicationsOverTimeChart";
import { RemindersWidget } from "../components/dashboard/RemindersWidget";
import { ErrorState, LoadingState } from "../components/ui/States";

export function DashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useStats(90);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Your job search at a glance.</p>
      </div>

      {isLoading && <LoadingState label="Loading dashboard…" />}
      {isError && <ErrorState message="Couldn't load your stats." onRetry={refetch} />}

      {stats && (
        <>
          <StatsCards stats={stats} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StatusBreakdownChart stats={stats} />
            <ApplicationsOverTimeChart stats={stats} />
          </div>

          <RemindersWidget />
        </>
      )}
    </div>
  );
}
