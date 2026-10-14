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
      <nav aria-label="Navegação principal" className="fixed bottom-5 left-1/2 z-50 w-[min(30rem,calc(100%-1.5rem))] -translate-x-1/2">
        <div className="neon-navigation">
        <div className="neon-navigation-inner grid grid-cols-[1fr_1fr_3.75rem_1fr_1fr] items-center px-3 py-1">
          {TABS.slice(0, 2).map((t) => (
            <TabLink key={t.to} {...t} active={pathname === t.to} />
          ))}
           <div />
          {TABS.slice(2).map((t) => (
            <TabLink key={t.to} {...t} active={pathname === t.to} />
          ))}
          <Link
            to="/nova-viagem"
            aria-label="Nova viagem"
            title="Nova viagem"
            className="neon-add absolute -top-3 left-1/2 flex h-14 w-14 items-center justify-center text-nav-text transition-transform hover:scale-105"
          >
            <span className="neon-add-inner flex h-full w-full items-center justify-center"><Plus size={28} /></span>
          </Link>
        </div>
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
      data-active={active}
      className={cn(
        "neon-navigation-tab flex flex-col items-center gap-1 rounded-md py-2 text-[10px]",
        active ? "font-extrabold" : "font-semibold text-nav-text/70",
      )}
    >
      <Icon size={22} />
      {label}
      <span className={cn("h-0.5 w-4 rounded-full", active ? "bg-accent" : "bg-transparent")} />
    </Link>
  );
}
