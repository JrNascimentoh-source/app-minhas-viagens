import { createFileRoute, Outlet, redirect, useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Calendar, FileText, Home, Plus, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

const TABS = [
  { to: "/", label: "Início", icon: Home },
  { to: "/calendario", label: "Calendário", icon: Calendar },
  { to: "/relatorio", label: "Relatório", icon: FileText },
  { to: "/ajustes", label: "Ajustes", icon: SlidersHorizontal },
] as const;

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth", replace: true });
      else setChecking(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate({ to: "/auth", replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (checking) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background">
      <Outlet />

      {/* Barra de navegação inferior */}
      <nav className="fixed bottom-4 left-1/2 z-50 w-[min(24rem,calc(100%-1.5rem))] -translate-x-1/2">
        <div className="relative flex items-center justify-between rounded-[2rem] border-2 border-accent/60 bg-card/95 px-3 py-2 shadow-xl backdrop-blur">
          {TABS.slice(0, 2).map((t) => (
            <TabLink key={t.to} {...t} active={pathname === t.to} />
          ))}
          <div className="w-14" />
          {TABS.slice(2).map((t) => (
            <TabLink key={t.to} {...t} active={pathname === t.to} />
          ))}
          <Link
            to="/nova-viagem"
            aria-label="Nova viagem"
            className="absolute -top-5 left-1/2 flex h-13 w-13 -translate-x-1/2 items-center justify-center rounded-2xl gradient-brand text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Plus size={28} />
          </Link>
        </div>
      </nav>
    </div>
  );
}

function TabLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex w-16 flex-col items-center gap-0.5 py-1 text-[11px]",
        active ? "font-extrabold text-accent" : "font-semibold text-muted-foreground",
      )}
    >
      <Icon size={22} />
      {label}
      <span className={cn("h-0.5 w-4 rounded-full", active ? "bg-accent" : "bg-transparent")} />
    </Link>
  );
}
