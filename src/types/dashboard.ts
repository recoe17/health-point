export interface FinalDetailItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  status?: "healthy" | "warning" | "attention";
  trend?: "up" | "down" | "stable";
}

export interface SummaryCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: number;
  color: "green" | "blue" | "amber" | "violet";
}
