-- REVIEW-ONLY exact deployed confirmation procedure (read-only pg_get_functiondef, 2026-11-18).
-- This file is loaded ONLY in disposable CI PostgreSQL. Not a production migration.
CREATE OR REPLACE FUNCTION public.allbiz_confirm_mollie_store_payment(p_order uuid, p_payment text, p_organization text, p_amount_cents integer, p_currency text, p_buyer_email text)
 RETURNS boolean LANGUAGE plpgsql SET search_path TO '' AS $function$
declare o public.allbiz_store_orders%rowtype; digital boolean; token text;
begin
 if current_user<>'service_role' then raise exception 'Not authorized';end if;
 if p_payment !~ '^tr_[A-Za-z0-9]+$' or p_organization !~ '^org_[A-Za-z0-9]+$' or p_currency<>'eur' or p_amount_cents<1 then return false;end if;
 select * into o from public.allbiz_store_orders where id=p_order for update;
 if not found or o.status<>'pending' or o.payment_provider<>'mollie'
 or o.mollie_payment_id<>p_payment or o.mollie_organization_id<>p_organization
 or o.amount_total_cents<>p_amount_cents or o.currency<>p_currency
 or o.amount_total_cents<>(select coalesce(sum(unit_cents*quantity),0) from public.allbiz_store_order_lines where order_id=p_order)
 then return false;end if;
 select coalesce(bool_or(coalesce(l.digital_file_path,'')<>''),false) into digital
 from public.allbiz_store_order_lines l where l.order_id=p_order;
 if digital then token=encode(extensions.gen_random_bytes(32),'hex');end if;
 update public.allbiz_store_orders set status='paid',paid_at=now(),buyer_email=left(coalesce(p_buyer_email,''),254),
 purchase_expires_at=now()+interval '30 days',
 fulfillment_status=case when digital then 'digital_ready' else 'awaiting_dispatch' end,
 download_token_hash=case when digital then encode(extensions.digest(token,'sha256'),'hex') else null end
 where id=p_order and status='pending';
 insert into public.allbiz_mollie_store_payment_events(mollie_payment_id,order_id,event_status,processed_at)
 values(p_payment,p_order,'processed',now())
 on conflict(mollie_payment_id) do update set order_id=excluded.order_id,event_status='processed',processed_at=now();
 return true;
end $function$;
