import { useReminders } from "../../hooks/useApplications";
import { LoadingState, ErrorState, EmptyState } from "../ui/States";
import { StatusBadge } from "../ui/StatusBadge";

export function RemindersWidget() {
  const { data: reminders, isLoading, isError, refetch } = useReminders(7);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">Upcoming deadlines & follow-ups</h3>
      <p className="text-xs text-slate-400">Next 7 days</p>

      <div className="mt-3">
        {isLoading && <LoadingState label="Loading reminders…" />}
        {isError && <ErrorState message="Couldn't load reminders." onRetry={refetch} />}
        {!isLoading && !isError && reminders && reminders.length === 0 && (
          <EmptyState title="Nothing due soon" description="Deadlines and follow-ups within a week show up here." />
        )}
        {!isLoading && !isError && reminders && reminders.length > 0 && (
          <ul className="flex flex-col divide-y divide-slate-100">
            {reminders.map((app) => (
              <li key={app.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {app.company} — {app.role}
                  </p>
                  <p className="text-xs text-slate-500">
                    {app.deadline && `Deadline ${new Date(app.deadline).toLocaleDateString()}`}
                    {app.deadline && app.follow_up_date && " · "}
                    {app.follow_up_date && `Follow up ${new Date(app.follow_up_date).toLocaleDateString()}`}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
