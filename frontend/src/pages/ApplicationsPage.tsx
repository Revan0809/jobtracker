import { useState } from "react";
import type { Application, ApplicationFilters } from "../types";
import { useApplications, useDeleteApplication } from "../hooks/useApplications";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { ApplicationFiltersBar } from "../components/applications/ApplicationFilters";
import { ApplicationTable } from "../components/applications/ApplicationTable";
import { ApplicationModal, type ApplicationModalState } from "../components/applications/ApplicationModal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Button } from "../components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";

export function ApplicationsPage() {
  const [filters, setFilters] = useState<ApplicationFilters>({});
  const debouncedCompany = useDebouncedValue(filters.company, 300);
  const [modalState, setModalState] = useState<ApplicationModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);

  const { data: applications, isLoading, isError, refetch } = useApplications({
    ...filters,
    company: debouncedCompany,
  });
  const deleteMutation = useDeleteApplication();

  const hasActiveFilters = Boolean(filters.company || filters.status || filters.date_from || filters.date_to);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-500">Search, filter, and manage every application.</p>
        </div>
        <Button onClick={() => setModalState({ mode: "create" })}>+ Add application</Button>
      </div>

      <ApplicationFiltersBar filters={filters} onChange={setFilters} />

      {isLoading && <LoadingState label="Loading applications…" />}
      {isError && <ErrorState message="Couldn't load your applications." onRetry={refetch} />}

      {applications && applications.length === 0 && !hasActiveFilters && (
        <EmptyState
          title="No applications yet"
          description="Add your first application to start tracking your job search."
          action={<Button onClick={() => setModalState({ mode: "create" })}>+ Add application</Button>}
        />
      )}

      {applications && applications.length === 0 && hasActiveFilters && (
        <EmptyState
          title="No applications match your filters"
          description="Try clearing a filter or searching a different company."
          action={
            <Button variant="secondary" onClick={() => setFilters({})}>
              Clear filters
            </Button>
          }
        />
      )}

      {applications && applications.length > 0 && (
        <ApplicationTable
          applications={applications}
          onEdit={(app) => setModalState({ mode: "edit", application: app })}
          onDelete={setDeleteTarget}
        />
      )}

      <ApplicationModal state={modalState} onClose={() => setModalState(null)} />

      {deleteTarget && (
        <ConfirmDialog
          title="Delete application"
          description={`Delete the ${deleteTarget.role} application at ${deleteTarget.company}? This can't be undone.`}
          confirmLabel="Delete"
          isLoading={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() =>
            deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
          }
        />
      )}
    </div>
  );
}
