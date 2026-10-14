import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS, PERIOD_LABEL, brl, formatBR, formatTime, periodOf, toISODate } from "@/lib/dates";
import { paymentSummary } from '@/lib/payments';
import type { Trip } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-5 pt-8 pb-40">{children}</div>
  );
}

export function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{children}</h1>
      {sub ? <p className="mt-1 text-sm font-medium text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  variant?: "primary" | "outline" | "ghost" | "danger";
};

export function Button({ label, children, variant = "primary", className, ...rest }: ButtonProps) {
  const styles = {
    primary:
      "gradient-brand text-primary-foreground font-bold shadow-md hover:opacity-90 active:scale-[0.98]",
    outline:
      "border border-accent text-accent font-bold hover:bg-accent-soft active:scale-[0.98]",
    ghost: "text-muted-foreground font-semibold hover:text-foreground",
    danger:
      "border border-destructive text-destructive font-bold hover:bg-destructive/10 active:scale-[0.98]",
  }[variant];
  return (
    <button
      {...rest}
      className={cn(
        "flex h-12 scroll-mb-32 items-center justify-center rounded-lg px-4 text-sm transition-all disabled:opacity-50",
        styles,
        className,
      )}
    >
      {children ?? label}
    </button>
  );
}

export function Field({
  label,
  icon,
  ...inputProps
}: {
  label: string;
  icon?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-extrabold tracking-widest text-gold uppercase">{label}</span>
      <div className="flex h-13 items-center gap-3 rounded-lg border border-input bg-card px-4 focus-within:border-ring">
        {icon}
        <input
          {...inputProps}
          className="h-full w-full bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </label>
  );
}

export function MonthSwitcher({
  year,
  month0,
  onChange,
}: {
  year: number;
  month0: number;
  onChange: (year: number, month0: number) => void;
}) {
  const move = (delta: number) => {
    const d = new Date(year, month0 + delta, 1);
    onChange(d.getFullYear(), d.getMonth());
  };
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-2 py-1">
      <button
        onClick={() => move(-1)}
        aria-label="Mês anterior"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="text-sm font-bold text-foreground">
        {MONTHS[month0]} {year}
      </span>
      <button
        onClick={() => move(1)}
        aria-label="Próximo mês"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export function DonutChart({
  percent,
  size = 124,
  stroke = 14,
  label,
  children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, percent));
  const dash = (c * p) / 100;
  const mid = size / 2;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${p}%`}
    >
      <svg width={size} height={size}>
        <circle cx={mid} cy={mid} r={r} stroke="var(--track)" strokeWidth={stroke} fill="none" />
        {p > 0 && (
          <circle
            cx={mid}
            cy={mid}
            r={r}
            stroke="var(--accent)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            transform={`rotate(-90 ${mid} ${mid})`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function TripRow({ trip, onClick }: { trip: Trip; onClick?: () => void }) {
  const payment = paymentSummary(trip);
  const end = trip.completed_at ?? trip.registered_at;
  return (
    <Button variant="ghost"
      onClick={onClick}
      className="h-auto w-full flex-col items-stretch gap-3 rounded-lg border border-border bg-card px-4 py-4 text-left transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">Início · {formatBR(trip.trip_date)} · {formatTime(trip.departed_at)} · {PERIOD_LABEL[trip.period]}</p>
        <p className="mt-1 text-xs text-muted-foreground">{end ? `Fim · ${formatBR(toISODate(new Date(end)))} · ${formatTime(end)} · ${PERIOD_LABEL[periodOf(new Date(end))]}` : 'Fim · Em aberto'}</p>
        <p className="mt-2 break-words text-sm font-medium text-foreground">
          {trip.description || "Sem descrição"}
        </p>
      </div>
      <div className="border-t border-border pt-2">
        <p className="text-sm font-bold text-foreground">Viagem · {brl(payment.gross)}</p>
        {payment.advance > 0 && <p className="mt-1 text-xs text-accent">Descontado · Adiantamento {brl(payment.advance)}</p>}
        {payment.discount > 0 && <p className="mt-1 text-xs text-muted-foreground">Desconto · {brl(payment.discount)}</p>}
        <p className={cn("mt-1 text-sm font-semibold", trip.paid ? "text-ok" : "text-accent")}>
          {trip.status === 'open' ? 'Em aberto' : trip.paid ? `${payment.advance > 0 ? 'Valor recebido' : 'Recebido'} · ${brl(payment.received)}` : `Pendente · ${brl(payment.pending)}`}
        </p>
        {!trip.paid && payment.advance > 0 && <p className="mt-1 text-xs text-ok">Valor recebido · {brl(payment.received)}</p>}
        {trip.paid && payment.advance > 0 && <p className="mt-1 text-xs text-muted-foreground">Na finalização · {brl(payment.balance)}</p>}
      </div>
    </Button>
  );
}
