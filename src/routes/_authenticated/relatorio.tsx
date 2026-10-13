import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Card, DonutChart, MonthSwitcher, Screen, Title } from "@/components/ui";
import { brl } from "@/lib/dates";
import { openReportPdf } from "@/lib/report";
import { listTripsByMonth, monthStats } from "@/lib/trips";
import type { Trip } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/relatorio")({
  head: () => ({
    meta: [
      { title: "Relatório — Minhas Viagens" },
      { name: "description", content: "Resumo mensal de viagens e geração de relatório em PDF." },
      { property: "og:title", content: "Relatório — Minhas Viagens" },
      { property: "og:description", content: "Resumo mensal de viagens e geração de relatório em PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());
  const [trips, setTrips] = useState<Trip[]>([]);
  const [busy, setBusy] = useState(false);

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

  const stats = monthStats(trips, year, month0);

  const generate = () => {
    setBusy(true);
    try {
      openReportPdf(year, month0, stats, trips);
    } catch (e: any) {
      toast.error("Relatório", { description: e?.message ?? "Tente novamente." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title>Relatório</Title>

      <MonthSwitcher year={year} month0={month0} onChange={(y, m) => { setYear(y); setMonth0(m); }} />

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
          {stats.totalPending > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">A receber</p>
              <p className="text-lg font-extrabold text-accent">{brl(stats.totalPending)}</p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Dias trabalhados" value={String(stats.workedDays)} accent />
        <Stat label="Sem viagem" value={String(stats.notWorkedDays)} />
        <Stat label="Em aberto" value={String(stats.openDays)} />
      </div>

      <Button
        label={busy ? "Gerando..." : "Gerar relatório em PDF"}
        onClick={generate}
        disabled={busy}
      />
      <p className="-mt-2 text-center text-xs text-muted-foreground">
        O relatório abre em uma nova janela — escolha "Salvar como PDF".
      </p>
    </Screen>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="p-4 text-center">
      <p className={accent ? "text-2xl font-extrabold text-accent" : "text-2xl font-extrabold text-foreground"}>
        {value}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</p>
    </Card>
  );
}
