import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Application, ApplicationFilters, ApplicationInput, ApplicationStatus } from "../types";

const APPLICATIONS_KEY = "applications";

export function useApplications(filters: ApplicationFilters = {}) {
  return useQuery({
    queryKey: [APPLICATIONS_KEY, filters],
    queryFn: async () => {
      const { data } = await api.get<Application[]>("/applications", { params: filters });
      return data;
    },
  });
}

export function useReminders(withinDays = 7) {
  return useQuery({
    queryKey: [APPLICATIONS_KEY, "reminders", withinDays],
    queryFn: async () => {
      const { data } = await api.get<Application[]>("/applications/reminders", {
        params: { within_days: withinDays },
      });
      return data;
    },
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ApplicationInput) => {
      const { data } = await api.post<Application>("/applications", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPLICATIONS_KEY] });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ApplicationInput> }) => {
      const { data } = await api.patch<Application>(`/applications/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPLICATIONS_KEY] });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APPLICATIONS_KEY] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { data } = await api.patch<Application>(`/applications/${id}`, { status });
      return data;
    },
    // Optimistic update so dragging a card in the Kanban board feels instant
    // instead of snapping back while the PATCH request is in flight.
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: [APPLICATIONS_KEY] });
      const previous = queryClient.getQueriesData<Application[]>({ queryKey: [APPLICATIONS_KEY] });

      previous.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<Application[]>(
          key,
          data.map((app) => (app.id === id ? { ...app, status } : app)),
        );
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [APPLICATIONS_KEY] });
    },
  });
}
