import { APPLICATION_STATUSES, type ApplicationFilters as Filters } from "../../types";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

export function ApplicationFiltersBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <Input
        placeholder="Search by company…"
        value={filters.company ?? ""}
        onChange={(e) => onChange({ ...filters, company: e.target.value || undefined })}
        className="sm:col-span-2"
      />
      <Select
        value={filters.status ?? ""}
        onChange={(e) =>
          onChange({ ...filters, status: (e.target.value || undefined) as Filters["status"] })
        }
      >
        <option value="">All statuses</option>
        {APPLICATION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          aria-label="Applied from"
          value={filters.date_from ?? ""}
          onChange={(e) => onChange({ ...filters, date_from: e.target.value || undefined })}
        />
        <Input
          type="date"
          aria-label="Applied to"
          value={filters.date_to ?? ""}
          onChange={(e) => onChange({ ...filters, date_to: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
