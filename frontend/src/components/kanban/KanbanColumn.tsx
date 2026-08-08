import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import type { Application, ApplicationStatus } from "../../types";
import { ApplicationCard } from "./ApplicationCard";

const columnAccent: Record<ApplicationStatus, string> = {
  Applied: "border-t-status-applied",
  Interview: "border-t-status-interview",
  Offer: "border-t-status-offer",
  Rejected: "border-t-status-rejected",
};

export function KanbanColumn({
  status,
  applications,
  onCardClick,
  onAddClick,
}: {
  status: ApplicationStatus;
  applications: Application[];
  onCardClick: (application: Application) => void;
  onAddClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex min-h-[140px] w-full flex-col rounded-lg border-t-4 bg-slate-100/60 p-3 sm:min-h-[300px]",
        columnAccent[status],
        isOver && "bg-slate-200/60",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{status}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
          {applications.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} onClick={() => onCardClick(app)} />
        ))}
      </div>

      <button
        onClick={onAddClick}
        className="mt-3 rounded-md border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700"
      >
        + Add application
      </button>
    </div>
  );
}
