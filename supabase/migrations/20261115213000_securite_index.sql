-- Daftar : corrections demandées par les contrôles de Supabase après la fondation.
-- 1. Les fonctions internes passent dans un schéma « prive », que l'API n'expose pas.
-- 2. Index sur les clés étrangères.

create schema if not exists prive;
grant usage on schema prive to authenticated;

alter function public.role_dans(uuid)              set schema prive;
alter function public.est_membre(uuid)             set schema prive;
alter function public.peut_ecrire(uuid)            set schema prive;
alter function public.est_patron(uuid)             set schema prive;
alter function public.voit_couts(uuid)             set schema prive;
alter function public.prochain_numero(uuid, text)  set schema prive;
alter function public.magasin_cree()               set schema prive;
alter function public.vente_numero()               set schema prive;
alter function public.ligne_controle()             set schema prive;
alter function public.ligne_cout()                 set schema prive;
alter function public.facture_numero()             set schema prive;
alter function public.facture_immuable()           set schema prive;

-- Les corps de fonctions citent leur schéma : on les réécrit.
create or replace function prive.est_membre(m uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select prive.role_dans(m) is not null
$$;
create or replace function prive.peut_ecrire(m uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(prive.role_dans(m) in ('patron', 'vendeur'), false)
$$;
create or replace function prive.est_patron(m uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(prive.role_dans(m) = 'patron', false)
$$;
create or replace function prive.voit_couts(m uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(prive.role_dans(m) in ('patron', 'comptable'), false)
$$;

create or replace function prive.vente_numero() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.numero := 'T-' || lpad(prive.prochain_numero(new.magasin_id, 'ticket')::text, 4, '0');
  return new;
end $$;

create or replace function prive.facture_numero() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.numero := (case new.type when 'facture' then 'F-' else 'A-' end)
    || to_char(new.date_emission, 'YYYY') || '-'
    || lpad(prive.prochain_numero(new.magasin_id, new.type)::text, 4, '0');
  return new;
end $$;

create or replace function prive.ligne_controle() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p integer; r integer;
begin
  select a.prix into p from public.articles a
   where a.id = new.article_id and a.magasin_id = new.magasin_id;
  if p is null then raise exception 'Article inconnu dans ce magasin.'; end if;
  if new.unite_id is not null
     and (tg_op = 'INSERT' or new.unite_id is distinct from old.unite_id)
     and not exists (
       select 1 from public.unites u
        where u.id = new.unite_id and u.article_id = new.article_id and u.etat = 'stock') then
    raise exception 'Cette unité n''est pas en stock.';
  end if;
  if not prive.est_patron(new.magasin_id) then
    select m.remise_max_vendeur into r from public.magasins m where m.id = new.magasin_id;
    if new.prix_unitaire * 100 < p * (100 - r) then
      raise exception 'Remise trop forte : le prix minimum est % DH.', ceil(p * (100 - r) / 100.0)::integer;
    end if;
  end if;
  return new;
end $$;

create or replace function prive.facture_immuable() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Une facture ne se modifie pas et ne se supprime pas : un retour produit un avoir.';
end $$;

-- Droits : seuls les contrôles de rôle servent aux règles d'accès, pour les comptes connectés.
revoke execute on all functions in schema prive from public, anon, authenticated;
grant execute on function prive.role_dans(uuid), prive.est_membre(uuid), prive.peut_ecrire(uuid),
                          prive.est_patron(uuid), prive.voit_couts(uuid) to authenticated;
alter default privileges in schema prive revoke execute on functions from public;

-- Index sur les clés étrangères
create index on public.achats (article_id);
create index on public.achats (fournisseur_id);
create index on public.articles (catalogue_id);
create index on public.catalogue (cree_par_magasin);
create index on public.couts_articles (magasin_id);
create index on public.couts_lignes (magasin_id);
create index on public.credits (magasin_id);
create index on public.factures (facture_origine_id);
create index on public.journal (achat_id);
create index on public.journal (par);
create index on public.journal (vente_id);
create index on public.lignes_vente (article_id);
create index on public.lignes_vente (magasin_id);
create index on public.lignes_vente (unite_id);
create index on public.livraisons (magasin_id);
create index on public.magasins (cree_par);
create index on public.mouvements_stock (achat_id);
create index on public.mouvements_stock (magasin_id);
create index on public.mouvements_stock (par);
create index on public.mouvements_stock (unite_id);
create index on public.mouvements_stock (vente_id);
create index on public.paiements_fournisseurs (magasin_id);
create index on public.prospects (magasin_id);
create index on public.reparations (magasin_id);
create index on public.reparations (vente_id);
create index on public.retours (magasin_id);
create index on public.unites (achat_id);
create index on public.ventes (liee_a);
create index on public.ventes (vendeur_id);
