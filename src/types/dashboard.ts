export interface SummaryCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: number;
  color: "green" | "blue" | "amber" | "violet";
}
