import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { StatsOverview } from "../types";

export function useStats(days = 90) {
  return useQuery({
    queryKey: ["stats", "overview", days],
    queryFn: async () => {
      const { data } = await api.get<StatsOverview>("/stats/overview", { params: { days } });
      return data;
    },
  });
}
