import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS, PERIOD_LABEL, brl, formatBR } from "@/lib/dates";
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
    <div className={cn("rounded-3xl border border-border bg-card p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: "primary" | "outline" | "ghost" | "danger";
};

export function Button({ label, variant = "primary", className, ...rest }: ButtonProps) {
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
        "flex h-12 items-center justify-center rounded-2xl px-4 text-sm transition-all disabled:opacity-50",
        styles,
        className,
      )}
    >
      {label}
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
      <div className="flex h-13 items-center gap-3 rounded-2xl border border-input bg-card px-4 focus-within:border-ring">
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
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">
          {formatBR(trip.trip_date)} · {PERIOD_LABEL[trip.period]}
        </p>
        <p className="truncate text-xs font-medium text-muted-foreground">
          {trip.description || "Sem descrição"}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-foreground">{brl(Number(trip.amount))}</p>
        <p className={cn("text-xs font-semibold", trip.paid ? "text-ok" : "text-accent")}>
          {trip.status === "open" ? "Em aberto" : trip.paid ? "Pago" : "A receber"}
        </p>
      </div>
    </button>
  );
}
