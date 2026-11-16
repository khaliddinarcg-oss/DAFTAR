-- Daftar : verrous de caisse, vérifiés par le serveur même si l'application est modifiée.
-- 1. Les réglages du magasin (nom, informations de facturation, règles du vendeur : remise
--    maximale, délai de retour) ne changent que par le patron. Le vendeur peut toujours faire
--    l'inventaire, rangé dans le même élément.
-- 2. Un ticket de vente, une facture, un avoir et une écriture du journal ne se suppriment
--    jamais : un retour se fait par un retour, une erreur au journal par une écriture inverse.
-- 3. Les montants d'un ticket (article, quantité, prix, total de chaque ligne et du ticket) ne
--    changent plus après la vente. Le statut (retour, échange), la facture et l'avoir, eux,
--    s'ajoutent normalement.

create or replace function prive.montants_ticket(d jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('total', d->'total', 'lignes',
    coalesce((select jsonb_agg(jsonb_build_array(l->'ref', l->'qty', l->'price', l->'total') order by o)
              from jsonb_array_elements(d->'lines') with ordinality as t(l, o)), '[]'::jsonb))
$$;

create or replace function prive.element_avant() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.prive := new.collection in ('buys', 'pays', 'ops', 'stock$', 'units$', 'tickets$');
  if tg_op = 'INSERT' and new.collection = 'buys' and not new.supprime
     and coalesce(new.donnees->>'d', '') ~ '^\d{4}-\d{2}-\d{2}$'
     and new.donnees->>'d' >= '2026-11-16'
     and coalesce((new.donnees->>'dateIncertaine')::boolean, false) = false
     and coalesce(new.donnees->>'sup', '') = ''
     and coalesce((new.donnees->>'initial')::boolean, false) = false
     and not exists (select 1 from public.elements e
                      where e.magasin_id = new.magasin_id and e.collection = 'buys' and e.cle = new.cle) then
    raise exception 'Choisissez le fournisseur de cette réception.';
  end if;
  if tg_op = 'UPDATE' then
    if old.collection = 'invoices'
       and (new.donnees is distinct from old.donnees or new.supprime is distinct from old.supprime) then
      raise exception 'Une facture ne se modifie pas et ne se supprime pas : un retour produit un avoir.';
    end if;
    if new.supprime and not old.supprime and old.collection in ('tickets', 'ops') then
      raise exception 'Une vente ou une écriture du journal ne se supprime pas.';
    end if;
    if old.collection = 'tickets' and not old.supprime
       and prive.montants_ticket(new.donnees) is distinct from prive.montants_ticket(old.donnees) then
      raise exception 'Les montants d''une vente ne changent plus après l''encaissement : faites un retour ou un échange.';
    end if;
    if old.collection = 'meta' and not prive.est_patron(old.magasin_id)
       and (new.donnees->'shop' is distinct from old.donnees->'shop'
            or new.donnees->'info' is distinct from old.donnees->'info'
            or new.donnees->'rules' is distinct from old.donnees->'rules') then
      raise exception 'Seul le patron modifie les réglages du magasin.';
    end if;
    if new.supprime and not old.supprime and old.collection in ('stock', 'sups')
       and not prive.est_patron(old.magasin_id) then
      raise exception 'Seul le patron supprime un article ou un fournisseur.';
    end if;
    new.version := nextval('public.elements_version');
  end if;
  new.modifie_le := now();
  new.modifie_par := auth.uid();
  return new;
end $$;
revoke execute on function prive.element_avant(), prive.montants_ticket(jsonb) from public, anon, authenticated;
-- Le déclencheur s'exécute avec les droits de la personne connectée : il doit pouvoir appeler
-- cette fonction, qui ne fait que lire les montants d'un ticket.
grant execute on function prive.montants_ticket(jsonb) to authenticated;
