-- Daftar : lecture de fiche par l'IA, et fournisseur obligatoire à la réception.

-------------------------------------------------------------------------------
-- 1. Journal des analyses : chaque lecture de fiche par l'IA, pour plafonner
--    la dépense (60 par magasin et par jour) et savoir ce qu'elle coûte.
--    Écrit par la fonction analyser-fiche, avec la clé de service.
-------------------------------------------------------------------------------

create table public.analyses (
  id          uuid primary key default gen_random_uuid(),
  magasin_id  uuid not null references public.magasins(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  cree_le     timestamptz not null default now(),
  ok          boolean not null default false,
  modele      text not null default '',
  jetons_entree integer not null default 0,
  jetons_sortie integer not null default 0,
  erreur      text not null default ''
);
create index analyses_magasin_jour_idx on public.analyses (magasin_id, cree_le);
create index analyses_user_idx on public.analyses (user_id);

alter table public.analyses enable row level security;
-- Le patron et le comptable voient combien d'analyses le magasin a faites.
create policy "lire" on public.analyses for select to authenticated
  using (prive.voit_couts(magasin_id));

-------------------------------------------------------------------------------
-- 2. Rien n'entre en stock sans savoir d'où ça vient.
--    Une réception (collection buys) porte un fournisseur, ou la marque
--    « stock de départ » pour ce qui était déjà en magasin avant Daftar.
--    Vérifié à la création seulement (corrigé par la migration suivante).
-------------------------------------------------------------------------------

create or replace function prive.element_avant() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.prive := new.collection in ('buys', 'pays', 'ops', 'stock$', 'units$', 'tickets$');
  if tg_op = 'INSERT' and new.collection = 'buys' and not new.supprime
     and coalesce(new.donnees->>'sup', '') = ''
     and coalesce((new.donnees->>'initial')::boolean, false) = false then
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
