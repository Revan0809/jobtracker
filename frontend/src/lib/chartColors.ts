// Status colors double as the app's status semantics (Applied = neutral/info,
// Interview = in-progress, Offer = good, Rejected = critical), so we borrow
// the dataviz skill's reserved status palette rather than a generic
// categorical set — these ARE application states, not arbitrary series.
// Values are the validated hex steps from the skill's palette reference.
export const STATUS_COLORS: Record<string, { light: string; dark: string }> = {
  Applied: { light: "#2a78d6", dark: "#3987e5" },
  Interview: { light: "#fab219", dark: "#fab219" },
  Offer: { light: "#0ca30c", dark: "#0ca30c" },
  Rejected: { light: "#d03b3b", dark: "#d03b3b" },
};

export function statusColor(status: string): string {
  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return STATUS_COLORS[status]?.[isDark ? "dark" : "light"] ?? "#2a78d6";
}

// Sequential blue, single hue, for the applications-over-time trend (one series).
export const SEQUENTIAL_BLUE = "#2a78d6";

export const CHART_CHROME = {
  grid: "#e1e0d9",
  axis: "#898781",
  text: "#52514e",
};
