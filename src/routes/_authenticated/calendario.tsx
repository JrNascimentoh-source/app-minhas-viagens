import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, MonthSwitcher, Screen, Title, TripRow } from "@/components/ui";
import { daysInMonth, formatBR, toISODate } from "@/lib/dates";
import {
  dayStatus,
  deleteTrip,
  groupByDate,
  listTripsByMonth,
  markPaid,
  type DayStatus,
} from "@/lib/trips";
import type { Trip } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário — Minhas Viagens" },
      { name: "description", content: "Veja os dias trabalhados, em aberto e sem viagem no calendário mensal." },
      { property: "og:title", content: "Calendário — Minhas Viagens" },
      { property: "og:description", content: "Veja os dias trabalhados, em aberto e sem viagem no calendário mensal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];

function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth());
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selected, setSelected] = useState<string | null>(toISODate(today));
  const [actionTrip, setActionTrip] = useState<Trip | null>(null);

  const load = useCallback(async () => {
    try {
      setTrips(await listTripsByMonth(year, month0));
    } catch (e: any) {
      toast.error("Não foi possível carregar", { description: e?.message ?? "Verifique sua conexão." });
    }
  }, [year, month0]);

  useEffect(() => {
    load();
  }, [load]);

  const byDate = useMemo(() => groupByDate(trips), [trips]);
  const todayISO = toISODate(today);
  const blanks = new Date(year, month0, 1).getDay();
  const total = daysInMonth(year, month0);

  const cellCls = (s: DayStatus, isSel: boolean) =>
    cn(
      "flex h-11 w-full items-center justify-center rounded-full text-sm font-bold transition-all",
      s === "worked" && "bg-accent text-accent-foreground",
      s === "open" && "border-2 border-dashed border-accent text-accent",
      s === "none" && "bg-track text-muted-foreground",
      s === "today" && "border border-foreground text-foreground",
      s === "future" && "text-muted-foreground",
      isSel && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
    );

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < blanks; i++) cells.push(<div key={`b${i}`} />);
  for (let d = 1; d <= total; d++) {
    const iso = toISODate(new Date(year, month0, d));
    const s = dayStatus(iso, byDate, todayISO);
    cells.push(
      <button
        key={iso}
        onClick={() => setSelected(iso)}
        aria-label={`Dia ${d}`}
        className={cellCls(s, selected === iso)}
      >
        {d}
      </button>,
    );
  }

  const dayTrips = selected ? (byDate[selected] ?? []) : [];

  const doMarkPaid = async (trip: Trip) => {
    await markPaid(trip.id);
    setActionTrip(null);
    load();
  };

  const doDelete = async (trip: Trip) => {
    await deleteTrip(trip.id);
    setActionTrip(null);
    load();
  };

  return (
    <Screen>
      <Title>Calendário</Title>

      <MonthSwitcher year={year} month0={month0} onChange={(y, m) => { setYear(y); setMonth0(m); }} />

      <Card>
        <div className="grid grid-cols-7 gap-1">
          {WEEK.map((w, i) => (
            <div key={i} className="pb-1 text-center text-xs font-bold text-muted-foreground">
              {w}
            </div>
          ))}
          {cells}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <Legend label="Trabalhado" swatch="bg-accent" />
          <Legend label="Em aberto" swatch="border-2 border-dashed border-accent" />
          <Legend label="Sem viagem" swatch="bg-track" />
        </div>
      </Card>

      {selected && (
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-extrabold text-foreground">{formatBR(selected)}</h2>
          {dayTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma viagem neste dia.</p>
          ) : (
            dayTrips.map((t) => <TripRow key={t.id} trip={t} onClick={() => setActionTrip(t)} />)
          )}
        </div>
      )}

      {actionTrip && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4"
          onClick={() => setActionTrip(null)}
        >
          <div
            className="flex w-full max-w-md flex-col gap-2 rounded-3xl bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-extrabold text-foreground">{formatBR(actionTrip.trip_date)}</p>
            <p className="mb-2 text-sm text-muted-foreground">
              {actionTrip.description || "Viagem"} · {brl(Number(actionTrip.amount))}
            </p>
            {actionTrip.status === "open" && (
              <button
                className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-accent hover:bg-muted"
                onClick={() => {
                  setActionTrip(null);
                  navigate({ to: "/confirmar/$id", params: { id: actionTrip.id } });
                }}
              >
                Confirmar viagem
              </button>
            )}
            {actionTrip.status === "registered" && !actionTrip.paid && (
              <button
                className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-ok hover:bg-muted"
                onClick={() => doMarkPaid(actionTrip)}
              >
                Marcar como pago
              </button>
            )}
            <button
              className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-destructive hover:bg-muted"
              onClick={() => doDelete(actionTrip)}
            >
              Excluir
            </button>
            <button
              className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-muted-foreground hover:bg-muted"
              onClick={() => setActionTrip(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </Screen>
  );
}

function Legend({ label, swatch }: { label: string; swatch: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-4 w-4 rounded-full", swatch)} />
      <span className="text-xs font-semibold text-foreground">{label}</span>
    </div>
  );
}
