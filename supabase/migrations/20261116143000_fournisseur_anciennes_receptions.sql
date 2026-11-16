-- Daftar : la règle « fournisseur obligatoire » ne doit pas bloquer l'existant.
-- 1. Elle ne vise que les réceptions datées à partir du 16 novembre 2026 : un
--    magasin qui passe en ligne avec d'anciennes réceptions sans fournisseur
--    les envoie normalement.
-- 2. Un envoi avec remplacement (upsert) déclenche aussi le contrôle « insert » :
--    une ligne qui existe déjà en est exemptée, pour qu'un paiement sur un
--    ancien achat à crédit passe toujours.

create or replace function prive.element_avant() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.prive := new.collection in ('buys', 'pays', 'ops', 'stock$', 'units$', 'tickets$');
  if tg_op = 'INSERT' and new.collection = 'buys' and not new.supprime
     and coalesce(new.donnees->>'d', '') >= '2026-11-16'
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
