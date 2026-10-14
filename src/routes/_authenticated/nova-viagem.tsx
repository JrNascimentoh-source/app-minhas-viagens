import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Field, Screen, Title } from "@/components/ui";
import { maskDate, parseBR, parseMoney, toISODate } from "@/lib/dates";
import { createTrip } from "@/lib/trips";

export const Route = createFileRoute("/_authenticated/nova-viagem")({
  head: () => ({
    meta: [
      { title: "Nova viagem — Minhas Viagens" },
      { name: "description", content: "Registre uma nova viagem com data, valor e descrição." },
      { property: "og:title", content: "Nova viagem — Minhas Viagens" },
      { property: "og:description", content: "Registre uma nova viagem com data, valor e descrição." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewTripPage,
});

function NewTripPage() {
  const navigate = useNavigate();
  const [dateText, setDateText] = useState(() => {
    const iso = toISODate(new Date());
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  });
  const [amountText, setAmountText] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasAdvance, setHasAdvance] = useState(false);
  const [advanceText, setAdvanceText] = useState('');

  const save = async () => {
    const iso = parseBR(dateText);
    if (!iso) {
      toast.error("Data inválida", { description: "Use o formato DD/MM/AAAA." });
      return;
    }
    const amount = parseMoney(amountText);
    if (amount === null || amount <= 0) {
      toast.error("Valor inválido", { description: "Informe o valor da viagem, ex.: 160,00." });
      return;
    }
    setBusy(true);
    try {
      const advanceAmount = hasAdvance ? parseMoney(advanceText) : 0;
      if (advanceAmount === null || (hasAdvance && advanceAmount <= 0)) throw new Error('Informe o valor recebido adiantado.');
      await createTrip({ tripDate: iso, amount, description: description.trim(), advanceAmount });
      toast.success("Viagem anotada", { description: "Ela ficará em aberto até você confirmar." });
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error("Não foi possível salvar", { description: e?.message ?? "Tente novamente." });
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "h-13 w-full rounded-2xl border border-input bg-background px-4 text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-ring";

  return (
    <Screen>
      <div className="flex items-start justify-between">
        <Title>Nova viagem</Title>
        <button
          onClick={() => navigate({ to: "/" })}
          aria-label="Fechar"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
        >
          <X size={20} />
        </button>
      </div>

      <Card className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-extrabold tracking-widest text-gold uppercase">Data da viagem</span>
          <input
            value={dateText}
            onChange={(e) => setDateText(maskDate(e.target.value))}
            placeholder="DD/MM/AAAA"
            inputMode="numeric"
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-extrabold tracking-widest text-gold uppercase">Valor (R$)</span>
          <input
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="160,00"
            inputMode="decimal"
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-extrabold tracking-widest text-gold uppercase">Descrição (opcional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: Entrega no centro"
            rows={3}
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
          />
        </label>
        <label className="flex items-center gap-3 text-sm font-bold text-foreground">
          <input type="checkbox" checked={hasAdvance} onChange={(e) => setHasAdvance(e.target.checked)} className="h-5 w-5 accent-primary" />
          Valor de adiantamento
        </label>
        {hasAdvance && <Field label="Adiantamento recebido (R$)" value={advanceText} onChange={(e) => setAdvanceText(e.target.value)} inputMode="decimal" placeholder="0,00" />}
      </Card>

      <Button label={busy ? "Salvando..." : "Anotar viagem"} onClick={save} disabled={busy} />
    </Screen>
  );
}
