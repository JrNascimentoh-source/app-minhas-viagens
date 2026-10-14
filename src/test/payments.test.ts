import { describe, expect, it } from 'vitest';
import { paymentSummary, validatePayment } from '../lib/payments';

describe('recebimento de viagens', () => {
  it('recebe viagem cheia', () => {
    expect(paymentSummary({ amount: 1000, advance_amount: 0, discount_amount: 0, paid: true })).toMatchObject({ received: 1000, pending: 0 });
  });
  it('não duplica adiantamento com desconto e saldo recebido', () => {
    expect(paymentSummary({ amount: 1000, advance_amount: 200, discount_amount: 100, paid: true })).toMatchObject({ net: 900, balance: 700, received: 900, pending: 0 });
  });
  it('conta só o adiantamento se o saldo está pendente', () => {
    expect(paymentSummary({ amount: 1000, advance_amount: 200, discount_amount: 100, paid: false })).toMatchObject({ received: 200, pending: 700 });
  });
  it('aceita adiantamento que quita o valor líquido', () => {
    expect(() => validatePayment(1000, 900, 100)).not.toThrow();
  });
  it('rejeita descontos e adiantamentos maiores que a viagem', () => {
    expect(() => validatePayment(1000, 900, 200)).toThrow();
    expect(() => validatePayment(1000, -1, 0)).toThrow();
  });
});