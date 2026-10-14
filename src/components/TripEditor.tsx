import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Field } from '@/components/ui';
import { deleteTrip, markPaid, updateTrip } from '@/lib/trips';
import { parseMoney } from '@/lib/dates';
import type { Trip } from '@/lib/types';

function localTime(iso: string) {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function TripEditor({ trip, onClose, onSaved }: { trip: Trip; onClose: () => void; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(String(trip.amount).replace('.', ','));
  const [advance, setAdvance] = useState(String(trip.advance_amount).replace('.', ','));
  const [discount, setDiscount] = useState(String(trip.discount_amount).replace('.', ','));
  const [description, setDescription] = useState(trip.description);
  const [start, setStart] = useState(localTime(trip.departed_at));
  const [end, setEnd] = useState(trip.completed_at || trip.registered_at ? localTime(trip.completed_at ?? trip.registered_at ?? trip.departed_at) : '');
  const [paid, setPaid] = useState(trip.paid);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); toast.success('Registro atualizado'); onSaved(); onClose(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar.'); }
    finally { setBusy(false); }
  };

  const save = () => run(async () => {
    const gross = parseMoney(amount), upfront = parseMoney(advance), deduction = parseMoney(discount);
    if (gross === null || upfront === null || deduction === null || !start || !end) throw new Error('Preencha os valores e os horários de início e fim.');
    await updateTrip(trip.id, { amount: gross, advance_amount: upfront, discount_amount: deduction, description: description.trim(), departed_at: new Date(start).toISOString(), completed_at: new Date(end).toISOString(), paid: paid || gross - deduction - upfront === 0 });
  });

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-overlay p-4" onClick={() => !busy && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="trip-editor-title" className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
      <h2 id="trip-editor-title" className="mb-4 text-xl font-bold">{deleting ? 'Excluir viagem?' : editing ? 'Editar viagem' : 'Registro da viagem'}</h2>
      {deleting ? <p className="mb-4 text-sm text-muted-foreground">Esta viagem será removida do histórico, calendário e relatório. Não é possível desfazer.</p> : editing ? <div className="mb-4 flex flex-col gap-3">
        <Field label="Valor da viagem (R$)" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        <Field label="Adiantamento (R$)" value={advance} onChange={(e) => setAdvance(e.target.value)} inputMode="decimal" />
        <Field label="Desconto (R$)" value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" />
        <Field label="Início" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        <Field label="Fim" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        <Field label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-5 w-5 accent-primary" />Saldo recebido</label>
      </div> : <p className="mb-4 break-words text-sm text-muted-foreground">{trip.description || 'Sem descrição'}</p>}
      <div className="flex flex-col gap-2">
        {deleting ? <Button label="Excluir definitivamente" variant="danger" disabled={busy} onClick={() => run(() => deleteTrip(trip.id))} /> : editing ? <Button label={busy ? 'Salvando...' : 'Salvar alterações'} disabled={busy} onClick={save} /> : <>
          <Button label="Editar viagem" onClick={() => setEditing(true)} />
          {!trip.paid && <Button label="Marcar como recebido" variant="outline" disabled={busy} onClick={() => run(() => markPaid(trip.id))} />}
          <Button label="Excluir viagem" variant="danger" onClick={() => setDeleting(true)} />
        </>}
        <Button label="Cancelar" variant="ghost" disabled={busy} onClick={onClose} />
      </div>
    </section>
  </div>;
}