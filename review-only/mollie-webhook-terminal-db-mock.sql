-- Review-only disposable PostgreSQL test of terminal webhook/worker race.
-- This is an isolated model, NOT the deployed confirm/cancel RPC.
\set ON_ERROR_STOP on
CREATE TEMP TABLE webhook_race_order (
 id integer PRIMARY KEY, status text NOT NULL CHECK(status IN ('pending','paid','cancelled')),
 stock integer NOT NULL, fulfillments integer NOT NULL DEFAULT 0,
 refunds integer NOT NULL DEFAULT 0
);
INSERT INTO webhook_race_order VALUES (1,'pending',0,0,0),(2,'pending',0,0,0);
CREATE OR REPLACE FUNCTION pg_temp.apply_mock_provider_event(p_id integer,p_event text)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE s text;
BEGIN
 SELECT status INTO s FROM webhook_race_order WHERE id=p_id FOR UPDATE;
 IF s IS NULL OR s<>'pending' THEN RETURN false;END IF;
 IF p_event='paid' THEN
 UPDATE webhook_race_order SET status='paid',fulfillments=fulfillments+1 WHERE id=p_id;
 ELSIF p_event IN ('failed','canceled','expired') THEN
 UPDATE webhook_race_order SET status='cancelled',stock=stock+1,refunds=refunds+1 WHERE id=p_id;
 ELSE RETURN false;END IF;
 RETURN true;
END $$;
DO $$
BEGIN
 IF NOT pg_temp.apply_mock_provider_event(1,'paid') THEN RAISE EXCEPTION 'Paid event rejected';END IF;
 IF pg_temp.apply_mock_provider_event(1,'paid') THEN RAISE EXCEPTION 'Webhook replay applied';END IF;
 IF pg_temp.apply_mock_provider_event(1,'failed') THEN RAISE EXCEPTION 'Stale failed event reversed paid order';END IF;
 IF NOT pg_temp.apply_mock_provider_event(2,'failed') THEN RAISE EXCEPTION 'Terminal failure rejected';END IF;
 IF pg_temp.apply_mock_provider_event(2,'paid') THEN RAISE EXCEPTION 'Late paid event changed cancelled order';END IF;
 IF EXISTS(SELECT 1 FROM webhook_race_order WHERE
 (id=1 AND (status<>'paid' OR fulfillments<>1 OR stock<>0 OR refunds<>0)) OR
 (id=2 AND (status<>'cancelled' OR fulfillments<>0 OR stock<>1 OR refunds<>1)))
 THEN RAISE EXCEPTION 'Terminal replay/stock invariants failed';END IF;
 RAISE NOTICE 'PASS isolated mocked webhook replay and conflicting terminal events';
END $$;
