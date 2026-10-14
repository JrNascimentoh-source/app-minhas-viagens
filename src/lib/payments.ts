import type { Trip } from './types';

export function paymentSummary(trip: Pick<Trip, 'amount' | 'advance_amount' | 'discount_amount' | 'paid'>) {
  const gross = Number(trip.amount);
  const advance = Number(trip.advance_amount ?? 0);
  const discount = Number(trip.discount_amount ?? 0);
  const net = Math.round((gross - discount) * 100) / 100;
  const balance = Math.round((net - advance) * 100) / 100;
  return { gross, advance, discount, net, balance, received: trip.paid ? net : advance, pending: trip.paid ? 0 : balance };
}

export function validatePayment(amount: number, advance: number, discount: number) {
  if (![amount, advance, discount].every(Number.isFinite) || amount <= 0 || advance < 0 || discount < 0) throw new Error('Informe valores válidos.');
  if (advance + discount > amount) throw new Error('Adiantamento e desconto não podem ultrapassar o valor da viagem.');
}