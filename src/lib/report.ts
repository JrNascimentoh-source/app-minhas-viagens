import { MONTHS, PERIOD_LABEL, brl, formatBR, formatTime, periodOf, toISODate } from "./dates";
import { paymentSummary } from './payments';
import type { MonthStats } from "./trips";
import type { Trip } from "./types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildReportHtml(year: number, month0: number, stats: MonthStats, trips: Trip[]): string {
  const registered = trips
    .filter((t) => t.status === "registered")
    .sort((a, b) => a.trip_date.localeCompare(b.trip_date));
  const rows = registered
    .map(
      (t) => {
        const payment = paymentSummary(t);
        const end = t.completed_at ?? t.registered_at;
        return `<tr>
        <td>${formatBR(t.trip_date)} ${formatTime(t.departed_at)} · ${PERIOD_LABEL[t.period]}<br>${end ? `${formatBR(toISODate(new Date(end)))} ${formatTime(end)} · ${PERIOD_LABEL[periodOf(new Date(end))]}` : 'Fim não informado'}</td>
        <td>${esc(t.description || "-")}</td>
        <td class="r">${brl(payment.gross)}<br>Adiantamento: ${brl(payment.advance)}<br>Desconto: ${brl(payment.discount)}</td>
        <td>${t.paid ? 'Recebido' : 'Pendente'}<br>Valor recebido: ${brl(payment.received)}<br>Saldo pendente: ${brl(payment.pending)}${payment.advance > 0 ? `<br>Descontado (adiantamento): ${brl(payment.advance)}` : ''}</td>
      </tr>`;
      },
    )
    .join("");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório ${MONTHS[month0]} ${year}</title><style>
    body{font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#1B1A19;padding:32px}
    h1{font-size:22px;margin:0 0 4px} .sub{color:#66625D;margin-bottom:24px}
    .kpis{display:flex;gap:12px;margin-bottom:24px}
    .kpi{flex:1;border:1px solid #E7E3DE;border-radius:12px;padding:14px}
    .kpi b{display:block;font-size:22px;margin-top:4px}
    .accent{color:#D9480F}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th,td{text-align:left;padding:8px 6px;border-bottom:1px solid #E7E3DE}
    th{color:#66625D;font-weight:600} .r{text-align:right}
    .foot{margin-top:24px;color:#66625D;font-size:12px}
  </style></head><body>
    <h1>Relatório mensal de viagens</h1>
    <div class="sub">${MONTHS[month0]} de ${year}</div>
    <div class="kpis">
      <div class="kpi">Dias trabalhados<b>${stats.workedDays}</b></div>
      <div class="kpi">Dias não trabalhados<b>${stats.notWorkedDays}</b></div>
      <div class="kpi">Total recebido<b class="accent">${brl(stats.totalReceived)}</b></div>
    </div>
    ${
      registered.length
        ? `<table><thead><tr><th>Início / Fim</th><th>Descrição</th><th class="r">Valores</th><th>Recebimento</th></tr></thead><tbody>${rows}</tbody></table>`
        : "<p>Nenhuma viagem registrada neste mês.</p>"
    }
    <div class="foot">Total recebido considera valores recebidos nas viagens concluídas, incluindo adiantamentos sem contá-los novamente. Descontos reduzem o valor líquido.${
      stats.totalPending > 0 ? ` A receber: ${brl(stats.totalPending)}.` : ""
    }</div>
  </body></html>`;
}

export function openReportPdf(year: number, month0: number, stats: MonthStats, trips: Trip[]) {
  const html = buildReportHtml(year, month0, stats, trips);
  const w = window.open("", "_blank");
  if (!w) throw new Error("O navegador bloqueou a janela do relatório. Permita pop-ups para este site.");
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
