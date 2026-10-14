import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Field, Screen, Title } from "@/components/ui";
import { PERIOD_LABEL, brl, formatBR, formatTime, parseMoney } from "@/lib/dates";
import { paymentSummary } from '@/lib/payments';
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
  const [withDiscount, setWithDiscount] = useState<boolean | null>(null);
  const [discountText, setDiscountText] = useState('');
  const discount = withDiscount ? parseMoney(discountText) : 0;
  const payment = trip ? paymentSummary({ ...trip, discount_amount: discount ?? 0 }) : null;

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
    if (completed && withDiscount === null) {
      toast.info('Escolha Viagem Cheia ou Viagem C/ Desconto.');
      return;
    }
    if (completed && (discount === null || (withDiscount && discount <= 0))) {
      toast.error('Informe um desconto maior que zero.');
      return;
    }
    if (completed && payment && payment.balance < 0) {
      toast.error('Adiantamento e desconto ultrapassam o valor da viagem.');
      return;
    }
    if (completed && payment?.balance !== 0 && paid === null) {
      toast.info("Falta uma resposta", { description: "Você já recebeu o pagamento?" });
      return;
    }
    setBusy(true);
    try {
      await confirmTrip(id, { completed, paid: paid === true || payment?.balance === 0, discountAmount: discount ?? 0 });
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

      {completed === true && <div className="flex flex-col gap-3">
        <p className="text-sm font-bold">Finalização da viagem</p>
        <div className="grid grid-cols-2 gap-2">
          <Button label="Viagem Cheia" variant={withDiscount === false ? 'primary' : 'outline'} onClick={() => setWithDiscount(false)} />
          <Button label="Viagem C/ Desconto" variant={withDiscount === true ? 'primary' : 'outline'} className="h-auto min-h-12 py-2" onClick={() => setWithDiscount(true)} />
        </div>
        {withDiscount && <Field label="Valor do desconto (R$)" value={discountText} onChange={(e) => setDiscountText(e.target.value)} inputMode="decimal" placeholder="0,00" />}
        {payment && <div className="space-y-1 border-y border-border py-3 text-sm">
          <p>Valor da viagem <strong className="float-right">{brl(payment.gross)}</strong></p>
          <p>Adiantamento recebido <strong className="float-right">{brl(payment.advance)}</strong></p>
          <p>Desconto <strong className="float-right">{brl(payment.discount)}</strong></p>
          <p className="text-accent">Saldo a receber <strong className="float-right">{brl(payment.balance)}</strong></p>
        </div>}
      </div>}

      {completed === true && withDiscount !== null && payment && payment.balance > 0 && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-extrabold text-foreground">Já recebeu o saldo de {brl(payment.balance)}?</p>
          <div className="flex gap-2">
            <Choice label="Sim, recebi" selected={paid === true} onClick={() => setPaid(true)} />
            <Choice label="Ainda não" selected={paid === false} onClick={() => setPaid(false)} />
          </div>
        </Card>
      )}

      <Button label={busy ? "Salvando..." : "Confirmar"} onClick={save} disabled={busy || !trip} />
    </Screen>
  );
}

function Choice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <Button variant={selected ? 'primary' : 'outline'}
      onClick={onClick}
      className={cn(
        "h-12 flex-1 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]",
        selected ? "gradient-brand text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </Button>
  );
}
