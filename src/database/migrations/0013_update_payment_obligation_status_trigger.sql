-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION update_payment_obligation_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC;
  due_date DATE;
  required_amount NUMERIC;
  new_status TEXT;
BEGIN
  -- Get the obligation ID from the payment row (works for INSERT/UPDATE/DELETE)
  -- For DELETE, OLD.obligation_id is used
  IF TG_OP = 'DELETE' THEN
    EXECUTE 'SELECT amount, due_date INTO required_amount, due_date
             FROM payment_obligations WHERE id = $1' INTO required_amount, due_date USING OLD.obligation_id;
  ELSE
    EXECUTE 'SELECT amount, due_date INTO required_amount, due_date
             FROM payment_obligations WHERE id = $1' INTO required_amount, due_date USING NEW.obligation_id;
  END IF;

  -- If no obligation found, skip (should not happen)
  IF required_amount IS NULL THEN
    RETURN NULL;
  END IF;

  -- Compute total paid for this obligation
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payments
  WHERE obligation_id = (CASE WHEN TG_OP = 'DELETE' THEN OLD.obligation_id ELSE NEW.obligation_id END);

  -- Determine new status
  IF total_paid >= required_amount THEN
    new_status := 'paid';
  ELSEIF due_date IS NOT NULL AND due_date < CURRENT_DATE THEN
    new_status := 'overdue';
  ELSEIF total_paid > 0 THEN
    new_status := 'ongoing';
  ELSE
    new_status := 'pending';
  END IF;

  -- Update the obligation status
  EXECUTE 'UPDATE payment_obligations
           SET status = $1
           WHERE id = $2' USING new_status, (CASE WHEN TG_OP = 'DELETE' THEN OLD.obligation_id ELSE NEW.obligation_id END);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on the payments table
CREATE TRIGGER update_obligation_status_after_payment_change
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payment_obligation_status();