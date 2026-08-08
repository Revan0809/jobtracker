import type { Application } from "../../types";
import { StatusBadge } from "../ui/StatusBadge";
import { Button } from "../ui/Button";

export function ApplicationTable({
  applications,
  onEdit,
  onDelete,
}: {
  applications: Application[];
  onEdit: (application: Application) => void;
  onDelete: (application: Application) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Company</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Role</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Applied</th>
            <th className="px-4 py-2 text-left font-medium text-slate-600">Deadline</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applications.map((app) => (
            <tr key={app.id} className="hover:bg-slate-50">
              <td className="px-4 py-2 font-medium text-slate-900">{app.company}</td>
              <td className="px-4 py-2 text-slate-600">{app.role}</td>
              <td className="px-4 py-2">
                <StatusBadge status={app.status} />
              </td>
              <td className="px-4 py-2 text-slate-500">
                {app.applied_date ? new Date(app.applied_date).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-2 text-slate-500">
                {app.deadline ? new Date(app.deadline).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-2">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => onEdit(app)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => onDelete(app)}>
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
