-- REVIEW-ONLY: disposable PostgreSQL fixture, never deploy.
-- Tests a proposed cancellation safety gate, not the deployed cancellation RPC.
\set ON_ERROR_STOP on
CREATE TEMP TABLE cancellation_guard_orders (
 id integer PRIMARY KEY, status text NOT NULL DEFAULT 'pending',
 payment_id text, stock_released boolean NOT NULL DEFAULT false
);
CREATE TEMP TABLE cancellation_guard_recovery (
 order_id integer PRIMARY KEY, phase text NOT NULL
);
INSERT INTO cancellation_guard_orders(id) VALUES (1),(2),(3),(4);
INSERT INTO cancellation_guard_recovery VALUES
 (1,'reserved'),(2,'provider_request_started'),(3,'payment_attached'),(4,'manual_review');
CREATE OR REPLACE FUNCTION pg_temp.safe_mock_cancel(p_order integer,p_payment text)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE o cancellation_guard_orders%ROWTYPE; r cancellation_guard_recovery%ROWTYPE;
BEGIN
 SELECT * INTO o FROM cancellation_guard_orders WHERE id=p_order FOR UPDATE;
 SELECT * INTO r FROM cancellation_guard_recovery WHERE order_id=p_order FOR UPDATE;
 IF NOT FOUND OR o.status<>'pending' OR r.order_id IS NULL THEN RETURN false;END IF;
 -- Without a verified provider terminal result, only a durable pre-provider
 -- reservation may be cancelled. A null payment ID is NOT sufficient proof.
 IF p_payment IS NULL AND r.phase<>'reserved' THEN RETURN false;END IF;
 IF p_payment IS NOT NULL AND (o.payment_id IS DISTINCT FROM p_payment
 OR r.phase<>'payment_attached') THEN RETURN false;END IF;
 UPDATE cancellation_guard_orders SET status='cancelled',stock_released=true WHERE id=p_order;
 UPDATE cancellation_guard_recovery SET phase='terminal' WHERE order_id=p_order;
 RETURN true;
END $$;
DO $$
BEGIN
 IF NOT pg_temp.safe_mock_cancel(1,NULL) THEN RAISE EXCEPTION 'Reserved-only cancellation rejected';END IF;
 IF pg_temp.safe_mock_cancel(1,NULL) THEN RAISE EXCEPTION 'Double cancellation accepted';END IF;
 IF pg_temp.safe_mock_cancel(2,NULL) THEN RAISE EXCEPTION 'Provider-started cancellation accepted';END IF;
 IF pg_temp.safe_mock_cancel(3,NULL) THEN RAISE EXCEPTION 'Attached payment cancelled without verification';END IF;
 IF pg_temp.safe_mock_cancel(4,NULL) THEN RAISE EXCEPTION 'Manual review cancelled';END IF;
 IF pg_temp.safe_mock_cancel(2,'tr_Unknown') THEN RAISE EXCEPTION 'Unknown payment ID cancelled';END IF;
 IF EXISTS(SELECT 1 FROM cancellation_guard_orders WHERE id<>1 AND (status<>'pending' OR stock_released))
 THEN RAISE EXCEPTION 'Unsafe inventory release';END IF;
 IF (SELECT phase FROM cancellation_guard_recovery WHERE order_id=1)<>'terminal'
 THEN RAISE EXCEPTION 'Recovery not closed atomically';END IF;
 RAISE NOTICE 'PASS isolated cancellation gate: provider ambiguity cannot release stock';
END $$;
