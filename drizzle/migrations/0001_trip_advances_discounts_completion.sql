ALTER TABLE public.trips ADD COLUMN advance_amount numeric NOT NULL DEFAULT 0, ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0, ADD COLUMN completed_at timestamptz;
UPDATE public.trips SET completed_at = registered_at WHERE status = 'registered' AND registered_at IS NOT NULL;
ALTER TABLE public.trips ADD CONSTRAINT trips_payment_values CHECK (advance_amount >= 0 AND discount_amount >= 0 AND advance_amount + discount_amount <= amount) NOT VALID;
ALTER TABLE public.trips ADD CONSTRAINT trips_completion_order CHECK (completed_at IS NULL OR completed_at >= departed_at) NOT VALID;
COMMENT ON COLUMN public.trips.advance_amount IS 'Amount already received before departure; reduces the outstanding balance, not net earnings.';
COMMENT ON COLUMN public.trips.discount_amount IS 'Deduction from gross trip earnings, separate from advances.';
COMMENT ON COLUMN public.trips.completed_at IS 'Actual completion timestamp; registered_at remains the record confirmation timestamp.';