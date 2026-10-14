import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { toast } from 'sonner';
import { clearTrips } from '@/lib/trips';
import { supabase } from "@/integrations/supabase/client";
import { Button, Card, Screen, Title } from "@/components/ui";
import { useTheme, type ThemeMode } from "@/theme/ThemeProvider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes — Minhas Viagens" },
      { name: "description", content: "Tema, conta e preferências do Minhas Viagens." },
      { property: "og:title", content: "Ajustes — Minhas Viagens" },
      { property: "og:description", content: "Tema, conta e preferências do Minhas Viagens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const MODES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "auto", label: "Automático", icon: Monitor },
];

function SettingsPage() {
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [clearing, setClearing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata?.["full_name"] as string) ?? "");
    });
  }, []);

  const clear = async () => {
    setBusy(true);
    try { await clearTrips(); toast.success('Histórico limpo'); setClearing(false); navigate({ to: '/' }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível limpar o histórico.'); }
    finally { setBusy(false); }
  };

  return (
    <Screen>
      <Title>Ajustes</Title>

      <Card className="flex flex-col gap-1">
        <p className="text-xs font-extrabold tracking-widest text-gold uppercase">Conta</p>
        <p className="mt-2 text-base font-bold text-foreground">{name || "Motorista"}</p>
        <p className="text-sm text-muted-foreground">{email}</p>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-xs font-extrabold tracking-widest text-gold uppercase">Tema</p>
        <div className="flex gap-2">
          {MODES.map((m) => (
            <Button
              variant={mode === m.value ? 'primary' : 'ghost'}
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all",
                mode === m.value
                  ? "gradient-brand text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-muted",
              )}
            >
              <m.icon size={16} />
              {m.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          No modo automático, o app segue o tema do seu aparelho.
        </p>
      </Card>

      <Button variant="danger" onClick={() => { setConfirmation(''); setClearing(true); }} className="gap-2"><Trash2 size={18} />Limpar viagens</Button>
      {clearing && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-overlay p-4">
        <section role="dialog" aria-modal="true" aria-labelledby="clear-title" className="w-full max-w-md rounded-lg border border-border bg-card p-5">
          <h2 id="clear-title" className="text-xl font-bold">Limpar todas as viagens?</h2>
          <p className="my-3 text-sm text-muted-foreground">Todas as suas viagens, incluindo as em aberto, serão excluídas. O calendário e os relatórios serão zerados. Não é possível desfazer.</p>
          <label className="mb-4 flex flex-col gap-2 text-sm">Digite LIMPAR para confirmar<input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-foreground" /></label>
          <Button label={busy ? 'Limpando...' : 'Limpar definitivamente'} variant="danger" className="w-full" disabled={busy || confirmation !== 'LIMPAR'} onClick={clear} />
          <Button label="Cancelar" variant="ghost" className="mt-2 w-full" disabled={busy} onClick={() => setClearing(false)} />
        </section>
      </div>}
    </Screen>
  );
}
