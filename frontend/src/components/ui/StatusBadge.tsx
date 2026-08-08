import clsx from "clsx";
import type { ApplicationStatus } from "../../types";

const statusStyles: Record<ApplicationStatus, string> = {
  Applied: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  Interview: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  Offer: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  Rejected: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
