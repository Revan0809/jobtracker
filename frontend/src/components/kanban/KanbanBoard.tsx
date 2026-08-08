import { useState } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "../../types";
import { useApplications, useUpdateApplicationStatus } from "../../hooks/useApplications";
import { ErrorState, LoadingState } from "../ui/States";
import { KanbanColumn } from "./KanbanColumn";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationModal, type ApplicationModalState } from "../applications/ApplicationModal";

export function KanbanBoard() {
  const { data: applications, isLoading, isError, refetch } = useApplications();
  const updateStatus = useUpdateApplicationStatus();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ApplicationModalState>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (isLoading) return <LoadingState label="Loading board…" />;
  if (isError || !applications) {
    return <ErrorState message="Couldn't load your applications." onRetry={refetch} />;
  }

  const byStatus: Record<ApplicationStatus, Application[]> = {
    Applied: [],
    Interview: [],
    Offer: [],
    Rejected: [],
  };
  applications.forEach((app) => byStatus[app.status].push(app));

  const activeApplication = applications.find((a) => a.id === activeId) ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as ApplicationStatus;
    const application = applications.find((a) => a.id === active.id);
    if (!application || application.status === newStatus) return;

    updateStatus.mutate({ id: application.id, status: newStatus });
  };

  return (
    <div>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {APPLICATION_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              applications={byStatus[status]}
              onCardClick={(application) => setModalState({ mode: "edit", application })}
              onAddClick={() => setModalState({ mode: "create", presetStatus: status })}
            />
          ))}
        </div>

        <DragOverlay>
          {activeApplication && <ApplicationCard application={activeApplication} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      <ApplicationModal state={modalState} onClose={() => setModalState(null)} />
    </div>
  );
}
