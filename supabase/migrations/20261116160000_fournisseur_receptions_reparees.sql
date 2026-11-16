-- Daftar : les réceptions réparées passent.
-- Jusqu'au 16 novembre 2026, les formulaires de réception appelaient receive()
-- sans la date : l'identifiant du fournisseur était rangé dans la date. Le
-- téléphone répare ces réceptions (repairReceptions dans index.html) en les
-- datant du jour et en les marquant dateIncertaine. Quand le fournisseur n'a pas
-- pu être retrouvé, elles n'en ont pas : la règle ne doit pas les refuser.
-- La règle ne vise donc que les réceptions avec une vraie date, à partir du
-- 16 novembre 2026, et non réparées.

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
revoke execute on function prive.element_avant() from public, anon, authenticated;
