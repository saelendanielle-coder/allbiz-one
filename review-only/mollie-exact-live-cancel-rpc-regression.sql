-- REVIEW ONLY: exact deployed cancellation function body, tested against disposable tables.
-- No production writes. PostgreSQL test user simulates service_role via SET ROLE.
\set ON_ERROR_STOP on
CREATE SCHEMA IF NOT EXISTS exact_cancel_fixture;
CREATE TABLE exact_cancel_fixture.orders (
 id uuid PRIMARY KEY,status text NOT NULL,payment_provider text NOT NULL,
 mollie_payment_id text,fulfillment_status text
);
CREATE TABLE exact_cancel_fixture.products(id uuid PRIMARY KEY,stock integer,updated_at timestamptz);
CREATE TABLE exact_cancel_fixture.lines(order_id uuid,product_id uuid,quantity integer);
CREATE OR REPLACE FUNCTION exact_cancel_fixture.cancel(p_order uuid,p_payment text,p_reason text)
RETURNS boolean LANGUAGE plpgsql SET search_path TO '' AS $function$
declare o exact_cancel_fixture.orders%rowtype; l record;
begin
 if current_user <> 'service_role' then raise exception 'Not authorized';end if;
 if p_reason not in ('expired','failed','cancelled') then raise exception 'Invalid reason';end if;
 select * into o from exact_cancel_fixture.orders where id=p_order for update;
 if not found or o.status<>'pending' or o.payment_provider<>'mollie' then return false;end if;
 if o.mollie_payment_id is not null and o.mollie_payment_id is distinct from p_payment then return false;end if;
 update exact_cancel_fixture.orders set status=case when p_reason='failed' then 'failed' else 'cancelled' end,
 fulfillment_status=case when p_reason='failed' then 'failed' else 'cancelled' end where id=p_order;
 for l in select product_id,quantity from exact_cancel_fixture.lines where order_id=p_order loop
  update exact_cancel_fixture.products set stock=stock+l.quantity,updated_at=now()
  where id=l.product_id and stock is not null;
 end loop;
 return true;
end $function$;
GRANT USAGE ON SCHEMA exact_cancel_fixture TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA exact_cancel_fixture TO service_role;
GRANT EXECUTE ON FUNCTION exact_cancel_fixture.cancel(uuid,text,text) TO service_role;
INSERT INTO exact_cancel_fixture.products VALUES('00000000-0000-0000-0000-000000000201',0,now());
INSERT INTO exact_cancel_fixture.orders VALUES
('00000000-0000-0000-0000-000000000202','pending','mollie',NULL,NULL),
('00000000-0000-0000-0000-000000000203','pending','mollie','tr_AlreadyAttached',NULL);
INSERT INTO exact_cancel_fixture.lines VALUES
('00000000-0000-0000-0000-000000000202','00000000-0000-0000-0000-000000000201',1);
SET ROLE service_role;
DO $$
DECLARE ok boolean;
BEGIN
 SELECT exact_cancel_fixture.cancel('00000000-0000-0000-0000-000000000202',NULL,'cancelled') INTO ok;
 IF NOT ok THEN RAISE EXCEPTION 'Expected exact live cancellation to accept null payment';END IF;
 IF (SELECT stock FROM exact_cancel_fixture.products WHERE id='00000000-0000-0000-0000-000000000201')<>1
 THEN RAISE EXCEPTION 'Expected exact live cancellation to restore stock';END IF;
 SELECT exact_cancel_fixture.cancel('00000000-0000-0000-0000-000000000202',NULL,'cancelled') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Duplicate cancellation accepted';END IF;
 SELECT exact_cancel_fixture.cancel('00000000-0000-0000-0000-000000000203','tr_Wrong','failed') INTO ok;
 IF ok THEN RAISE EXCEPTION 'Mismatched attached payment accepted';END IF;
 RAISE NOTICE 'PASS exact deployed cancellation body reproduces unsafe null-payment stock release; duplicate and mismatch guarded';
END $$;
RESET ROLE;
