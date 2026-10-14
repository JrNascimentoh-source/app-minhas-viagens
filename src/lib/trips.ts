import { supabase } from "@/integrations/supabase/client";
import type { Trip } from "./types";
import { daysInMonth, monthRange, periodOf, toISODate } from "./dates";
import { paymentSummary, validatePayment } from './payments';

export const REMINDER_HOURS = 9;

const reminderDate = () => new Date(Date.now() + REMINDER_HOURS * 3600 * 1000).toISOString();

export async function createTrip(input: {
  tripDate: string;
  amount: number;
  description: string;
  advanceAmount?: number;
}): Promise<Trip> {
  const now = new Date();
  validatePayment(input.amount, input.advanceAmount ?? 0, 0);
  const { data, error } = await supabase
    .from("trips")
    .insert({
      trip_date: input.tripDate,
      amount: input.amount,
      advance_amount: input.advanceAmount ?? 0,
      description: input.description,
      departed_at: now.toISOString(),
      period: periodOf(now),
      status: "open",
      next_reminder_at: reminderDate(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Trip;
}

export async function getTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Trip) ?? null;
}

export async function listOpenTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "open")
    .order("departed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Trip[];
}

export async function listTripsByMonth(year: number, month0: number): Promise<Trip[]> {
  const { start, end } = monthRange(year, month0);
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .gte("trip_date", start)
    .lte("trip_date", end)
    .order("trip_date", { ascending: false })
    .order("departed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Trip[];
}

export async function confirmTrip(id: string, answers: { completed: boolean; paid: boolean; discountAmount?: number }): Promise<Trip> {
  const trip = await getTrip(id);
  if (!trip) throw new Error('Viagem não encontrada.');
  const discount = answers.discountAmount ?? 0;
  validatePayment(Number(trip.amount), Number(trip.advance_amount), discount);
  if (answers.completed && new Date(trip.departed_at).getTime() > Date.now()) throw new Error('O início da viagem não pode estar no futuro.');
  const patch = answers.completed
    ? {
        status: "registered" as const,
        completed: true,
        paid: answers.paid,
        discount_amount: discount,
        completed_at: trip.completed_at ?? new Date().toISOString(),
        registered_at: new Date().toISOString(),
        next_reminder_at: null,
      }
    : { next_reminder_at: reminderDate() };
  const { data, error } = await supabase.from("trips").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Trip;
}

export async function snoozeTrip(id: string): Promise<void> {
  const { error } = await supabase.from("trips").update({ next_reminder_at: reminderDate() }).eq("id", id);
  if (error) throw error;
}

export async function markPaid(id: string): Promise<void> {
  const { error } = await supabase.from("trips").update({ paid: true }).eq("id", id);
  if (error) throw error;
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw error;
}

export async function clearTrips(): Promise<void> {
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!data.user) throw new Error('Entre novamente para limpar o histórico.');
  const { error } = await supabase.from('trips').delete().eq('user_id', data.user.id);
  if (error) throw error;
}

export async function updateTrip(id: string, patch: Pick<Trip, 'amount' | 'advance_amount' | 'discount_amount' | 'description' | 'departed_at' | 'completed_at' | 'paid'>): Promise<void> {
  validatePayment(patch.amount, patch.advance_amount, patch.discount_amount);
  const start = new Date(patch.departed_at);
  const end = patch.completed_at ? new Date(patch.completed_at) : null;
  if (!Number.isFinite(start.getTime()) || (end && (!Number.isFinite(end.getTime()) || end < start || end.getTime() > Date.now()))) throw new Error('Confira as datas de início e fim.');
  const { error } = await supabase.from('trips').update({ ...patch, trip_date: toISODate(start), period: periodOf(start) }).eq('id', id);
  if (error) throw error;
}

/* ---------- Estatísticas e calendário ---------- */

export type DayStatus = "worked" | "open" | "none" | "today" | "future";

export function groupByDate(trips: Trip[]): Record<string, Trip[]> {
  const map: Record<string, Trip[]> = {};
  for (const t of trips) (map[t.trip_date] ||= []).push(t);
  return map;
}

export function dayStatus(iso: string, byDate: Record<string, Trip[]>, todayISO: string): DayStatus {
  const list = byDate[iso] ?? [];
  if (list.some((t) => t.status === "registered")) return "worked";
  if (list.some((t) => t.status === "open")) return "open";
  if (iso > todayISO) return "future";
  if (iso === todayISO) return "today";
  return "none";
}

export type MonthStats = {
  workedDays: number;
  notWorkedDays: number;
  openDays: number;
  totalReceived: number;
  totalPending: number;
  percentWorked: number;
};

export function monthStats(trips: Trip[], year: number, month0: number, now = new Date()): MonthStats {
  const byDate = groupByDate(trips);
  const todayISO = toISODate(now);
  let workedDays = 0;
  let notWorkedDays = 0;
  let openDays = 0;
  for (let d = 1; d <= daysInMonth(year, month0); d++) {
    const iso = toISODate(new Date(year, month0, d));
    const s = dayStatus(iso, byDate, todayISO);
    if (s === "worked") workedDays++;
    else if (s === "open") openDays++;
    else if (s === "none") notWorkedDays++;
  }
  const registered = trips.filter((t) => t.status === "registered");
  const totalReceived = registered.reduce((sum, t) => sum + paymentSummary(t).received, 0);
  const totalPending = registered.reduce((sum, t) => sum + paymentSummary(t).pending, 0);
  const base = workedDays + notWorkedDays;
  return {
    workedDays,
    notWorkedDays,
    openDays,
    totalReceived,
    totalPending,
    percentWorked: base === 0 ? 0 : Math.round((workedDays / base) * 100),
  };
}
