import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Screen, Title } from "@/components/ui";
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setName((data.user?.user_metadata?.full_name as string) ?? "");
    });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
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
            <button
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
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          No modo automático, o app segue o tema do seu aparelho.
        </p>
      </Card>

      <button
        onClick={signOut}
        className="flex h-13 items-center justify-center gap-2 rounded-2xl border border-destructive text-base font-bold text-destructive transition-all hover:bg-destructive/10 active:scale-[0.98]"
      >
        <LogOut size={18} />
        Sair da conta
      </button>
    </Screen>
  );
}
