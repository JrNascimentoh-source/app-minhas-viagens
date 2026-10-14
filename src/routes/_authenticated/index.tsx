import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Card, DonutChart, Screen, Title, TripRow } from "@/components/ui";
import { MONTHS, PERIOD_LABEL, brl, formatBR, formatTime } from "@/lib/dates";
import { listOpenTrips, listTripsByMonth, monthStats, snoozeTrip } from "@/lib/trips";
import type { Trip } from "@/lib/types";
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TripEditor } from '@/components/TripEditor';

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Minhas Viagens — Início" },
      { name: "description", content: "Resumo do mês, viagens aguardando confirmação e registros recentes." },
      { property: "og:title", content: "Minhas Viagens — Início" },
      { property: "og:description", content: "Resumo do mês, viagens aguardando confirmação e registros recentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const now = new Date();
  const year = now.getFullYear();
  const month0 = now.getMonth();

  const [monthTrips, setMonthTrips] = useState<Trip[]>([]);
  const [open, setOpen] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error('Não foi possível sair. Tente novamente.'); setSigningOut(false); return; }
    navigate({ to: '/auth', replace: true });
  };

  const load = useCallback(async () => {
    try {
      const [m, o] = await Promise.all([listTripsByMonth(year, month0), listOpenTrips()]);
      setMonthTrips(m);
      setOpen(o);
    } catch (e: any) {
      toast.error("Não foi possível carregar", { description: e?.message ?? "Verifique sua conexão." });
    } finally {
      setLoading(false);
    }
  }, [year, month0]);

  useEffect(() => {
    load();
  }, [load]);

  const notYet = async (trip: Trip) => {
    try {
      await snoozeTrip(trip.id);
      toast.success("Combinado", { description: "A viagem continua em aberto." });
      load();
    } catch (e: any) {
      toast.error("Erro", { description: e?.message ?? "Tente novamente." });
    }
  };

  const stats = monthStats(monthTrips, year, month0);
  const recent = monthTrips.filter((t) => t.status === "registered").slice(0, 5);

  return (
    <Screen>
      <div className="flex items-start justify-between gap-3">
        <Title sub={`${MONTHS[month0]} ${year}`}>Minhas viagens</Title>
        <Button variant="ghost" title="Sair da conta" aria-label="Sair da conta" disabled={signingOut} onClick={signOut} className="h-auto min-w-12 flex-col gap-1 px-2 py-1 text-destructive"><LogOut size={24} /><span className="text-xs">Sair</span></Button>
      </div>

      <Card className="flex flex-row items-center gap-5">
        <DonutChart percent={stats.percentWorked} label={`${stats.percentWorked}% dos dias trabalhados`}>
          <span className="text-3xl font-extrabold text-foreground">{stats.percentWorked}%</span>
          <span className="text-[11px] font-semibold text-muted-foreground">trabalhados</span>
        </DonutChart>
        <div className="flex flex-1 flex-col gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Recebido no mês</p>
            <p className="text-2xl font-extrabold text-foreground">{brl(stats.totalReceived)}</p>
          </div>
          <div className="flex gap-5">
            <div>
              <p className="text-xl font-extrabold text-accent">{stats.workedDays}</p>
              <p className="text-xs font-semibold text-muted-foreground">dias com viagem</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-foreground">{stats.notWorkedDays}</p>
              <p className="text-xs font-semibold text-muted-foreground">sem viagem</p>
            </div>
          </div>
        </div>
      </Card>

      {open.map((trip) => (
        <div
          key={trip.id}
          className="flex flex-col gap-3 rounded-3xl border border-accent bg-accent-soft p-4"
        >
          <p className="text-xs font-extrabold tracking-wide text-accent">AGUARDANDO CONFIRMAÇÃO</p>
          <div>
            <p className="text-base font-bold text-foreground">
              {formatBR(trip.trip_date)} · saiu às {formatTime(trip.departed_at)} · {PERIOD_LABEL[trip.period]}
            </p>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {trip.description || "Sem descrição"} · {brl(Number(trip.amount))}
            </p>
          </div>
          <div className="flex gap-2.5">
            <Button
              label="Concluída"
              onClick={() => navigate({ to: "/confirmar/$id", params: { id: trip.id } })}
              className="h-11 flex-1"
            />
            <Button label="Ainda não" variant="outline" onClick={() => notYet(trip)} className="h-11 flex-1" />
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <h2 className="text-base font-extrabold text-foreground">Registradas recentemente</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma viagem registrada ainda neste mês. Toque no + para adicionar.
          </p>
        ) : (
          recent.map((t) => <TripRow key={t.id} trip={t} onClick={() => setSelectedTrip(t)} />)
        )}
      </div>
      {selectedTrip && <TripEditor trip={selectedTrip} onClose={() => setSelectedTrip(null)} onSaved={load} />}
    </Screen>
  );
}
