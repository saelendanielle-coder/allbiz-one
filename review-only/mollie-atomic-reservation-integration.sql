-- Disposable PostgreSQL integration test: order+inventory+recovery atomicity.
-- This fixture tests transaction semantics of the proposed insertion,
-- NOT the complete deployed checkout validation or Mollie network calls.
\set ON_ERROR_STOP on
CREATE TABLE public.mollie_atomic_test_stock (
 product_id uuid PRIMARY KEY, stock integer NOT NULL CHECK(stock>=0)
);
CREATE TABLE public.mollie_atomic_test_orders (
 order_id uuid PRIMARY KEY, seller_id uuid NOT NULL
);
CREATE TABLE public.mollie_atomic_test_recovery (
 order_id uuid PRIMARY KEY REFERENCES public.mollie_atomic_test_orders(order_id),
 seller_id uuid NOT NULL,
 phase text NOT NULL CHECK(phase IN ('reserved','provider_request_started'))
);
INSERT INTO public.mollie_atomic_test_stock VALUES ('00000000-0000-0000-0000-000000000031',2);
CREATE OR REPLACE FUNCTION public.mollie_atomic_test_reserve(
 p_order uuid,p_seller uuid,p_product uuid,p_bad_phase boolean
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 UPDATE public.mollie_atomic_test_stock SET stock=stock-1
 WHERE product_id=p_product AND stock>=1;
 IF NOT FOUND THEN RAISE EXCEPTION 'Out of stock'; END IF;
 INSERT INTO public.mollie_atomic_test_orders VALUES(p_order,p_seller);
 INSERT INTO public.mollie_atomic_test_recovery
 VALUES(p_order,p_seller,CASE WHEN p_bad_phase THEN 'invalid' ELSE 'reserved' END);
END;
$$;
DO $$
BEGIN
 BEGIN
  PERFORM public.mollie_atomic_test_reserve(
   '00000000-0000-0000-0000-000000000032',
   '10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000031',true);
  RAISE EXCEPTION 'Expected recovery insert failure';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 IF (SELECT stock FROM public.mollie_atomic_test_stock)!=2 THEN
  RAISE EXCEPTION 'Stock changed despite recovery failure';
 END IF;
 IF EXISTS(SELECT 1 FROM public.mollie_atomic_test_orders) THEN
  RAISE EXCEPTION 'Order survived recovery failure';
 END IF;
 IF EXISTS(SELECT 1 FROM public.mollie_atomic_test_recovery) THEN
  RAISE EXCEPTION 'Recovery row survived failure';
 END IF;
 PERFORM public.mollie_atomic_test_reserve(
  '00000000-0000-0000-0000-000000000033',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000031',false);
 IF (SELECT stock FROM public.mollie_atomic_test_stock)!=1
    OR (SELECT count(*) FROM public.mollie_atomic_test_orders)!=1
    OR (SELECT count(*) FROM public.mollie_atomic_test_recovery)!=1 THEN
  RAISE EXCEPTION 'Successful reservation not atomic';
 END IF;
 RAISE NOTICE 'PASS rollback on recovery insert failure; success commits all three rows';
END $$;
