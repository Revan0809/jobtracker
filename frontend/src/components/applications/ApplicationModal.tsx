import { Modal } from "../ui/Modal";
import { ApplicationForm } from "./ApplicationForm";
import { useCreateApplication, useUpdateApplication } from "../../hooks/useApplications";
import type { Application, ApplicationInput, ApplicationStatus } from "../../types";

export type ApplicationModalState =
  | { mode: "create"; presetStatus?: ApplicationStatus }
  | { mode: "edit"; application: Application }
  | null;

export function ApplicationModal({
  state,
  onClose,
}: {
  state: ApplicationModalState;
  onClose: () => void;
}) {
  const createMutation = useCreateApplication();
  const updateMutation = useUpdateApplication();

  if (state === null) return null;

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (input: ApplicationInput) => {
    if (state.mode === "edit") {
      updateMutation.mutate({ id: state.application.id, input }, { onSuccess: onClose });
    } else {
      createMutation.mutate(input, { onSuccess: onClose });
    }
  };

  const initialValues: Partial<Application> | undefined =
    state.mode === "edit"
      ? state.application
      : state.presetStatus
        ? { status: state.presetStatus }
        : undefined;

  return (
    <Modal title={state.mode === "edit" ? "Edit application" : "Add application"} onClose={onClose}>
      <ApplicationForm
        initialValues={initialValues}
        isEdit={state.mode === "edit"}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
      {(createMutation.isError || updateMutation.isError) && (
        <p className="mt-3 text-sm text-red-600">Couldn't save this application. Please try again.</p>
      )}
    </Modal>
  );
}
