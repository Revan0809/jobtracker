import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Application } from "../../types";

function isSoon(dateStr: string | null, days = 7): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  const diffDays = (target.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

export function ApplicationCard({
  application,
  onClick,
}: {
  application: Application;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const dueSoon = isSoon(application.deadline) || isSoon(application.follow_up_date);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={clsx(
        "cursor-grab touch-none rounded-lg border border-slate-200 bg-white p-3 shadow-sm",
        "hover:border-slate-300 hover:shadow active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <p className="text-sm font-medium text-slate-900">{application.company}</p>
      <p className="text-sm text-slate-500">{application.role}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {application.applied_date ? new Date(application.applied_date).toLocaleDateString() : "—"}
        </span>
        {dueSoon && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            Due soon
          </span>
        )}
      </div>
    </div>
  );
}
