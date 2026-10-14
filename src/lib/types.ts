export type Period = "manha" | "tarde" | "noite";
export type TripStatus = "open" | "registered";

export type Trip = {
  id: string;
  user_id: string;
  trip_date: string; // YYYY-MM-DD
  amount: number;
  advance_amount: number;
  discount_amount: number;
  completed_at: string | null;
  description: string;
  departed_at: string; // ISO
  period: Period;
  status: TripStatus;
  completed: boolean;
  paid: boolean;
  registered_at: string | null;
  next_reminder_at: string | null;
  created_at: string;
};
