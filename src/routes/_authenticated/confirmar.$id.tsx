import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Screen, Title } from "@/components/ui";
import { PERIOD_LABEL, brl, formatBR, formatTime } from "@/lib/dates";
import { confirmTrip, getTrip } from "@/lib/trips";
import type { Trip } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/confirmar/$id")({
  head: () => ({
    meta: [
      { title: "Confirmar viagem — Minhas Viagens" },
      { name: "description", content: "Confirme se a viagem foi concluída e se o pagamento foi recebido." },
      { property: "og:title", content: "Confirmar viagem — Minhas Viagens" },
      { property: "og:description", content: "Confirme se a viagem foi concluída e se o pagamento foi recebido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfirmPage,
});

function ConfirmPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [paid, setPaid] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getTrip(id)
      .then(setTrip)
      .catch((e) => toast.error("Erro", { description: e?.message ?? "Tente novamente." }));
  }, [id]);

  const save = async () => {
    if (completed === null) {
      toast.info("Falta uma resposta", { description: "A viagem foi concluída?" });
      return;
    }
    if (completed && paid === null) {
      toast.info("Falta uma resposta", { description: "Você já recebeu o pagamento?" });
      return;
    }
    setBusy(true);
    try {
      await confirmTrip(id, { completed, paid: paid === true });
      toast.success(completed ? "Viagem registrada" : "Tudo bem", {
        description: completed ? "Ela entrou para o seu registro do mês." : "A viagem continua em aberto.",
      });
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error("Não foi possível salvar", { description: e?.message ?? "Tente novamente." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <div className="flex items-start justify-between">
        <Title>Confirmar viagem</Title>
        <button
          onClick={() => navigate({ to: "/" })}
          aria-label="Fechar"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
        >
          <X size={20} />
        </button>
      </div>

      {trip && (
        <Card>
          <p className="text-base font-bold text-foreground">
            {formatBR(trip.trip_date)} · saiu às {formatTime(trip.departed_at)} · {PERIOD_LABEL[trip.period]}
          </p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {trip.description || "Sem descrição"} · {brl(Number(trip.amount))}
          </p>
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-extrabold text-foreground">A viagem foi concluída?</p>
        <div className="flex gap-2">
          <Choice label="Sim" selected={completed === true} onClick={() => setCompleted(true)} />
          <Choice label="Não" selected={completed === false} onClick={() => { setCompleted(false); setPaid(null); }} />
        </div>
      </Card>

      {completed === true && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-extrabold text-foreground">Já recebeu o pagamento?</p>
          <div className="flex gap-2">
            <Choice label="Sim, recebi" selected={paid === true} onClick={() => setPaid(true)} />
            <Choice label="Ainda não" selected={paid === false} onClick={() => setPaid(false)} />
          </div>
        </Card>
      )}

      <Button label={busy ? "Salvando..." : "Confirmar"} onClick={save} disabled={busy} />
    </Screen>
  );
}

function Choice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-12 flex-1 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]",
        selected ? "gradient-brand text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
