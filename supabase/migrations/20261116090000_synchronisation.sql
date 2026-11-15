-- Daftar : synchronisation des téléphones d'un même magasin.
--
-- Étape 1 de la feuille de route. L'application garde son état S et sa logique
-- métier ; chaque élément de S (un article, une unité, un ticket, une facture…)
-- devient une ligne de `elements`, envoyée quand elle change. Les tables de la
-- fondation restent la cible de l'étape « enregistrement côté serveur ».
--
-- Ce que le serveur garantit dès maintenant :
-- - le vendeur ne reçoit jamais les prix d'achat, les achats, ni le journal ;
-- - deux tickets ou deux factures d'un magasin ne portent jamais le même numéro ;
-- - une facture ou un avoir ne se modifie pas et ne se supprime pas ;
-- - seul le patron supprime un article ou un fournisseur ;
-- - un magasin garde toujours au moins un patron.

-------------------------------------------------------------------------------
-- Éléments
-------------------------------------------------------------------------------

create sequence public.elements_version;

create table public.elements (
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  collection text not null check (collection ~ '^[a-z]+\$?$'),
  cle        text not null check (length(cle) between 1 and 64),
  donnees    jsonb not null,
  prive      boolean not null default false,
  supprime   boolean not null default false,
  version    bigint not null default nextval('public.elements_version'),
  modifie_le timestamptz not null default now(),
  modifie_par uuid default auth.uid() references auth.users(id) on delete set null,
  primary key (magasin_id, collection, cle)
);
alter sequence public.elements_version owned by public.elements.version;

create index elements_pull_idx on public.elements (magasin_id, version);
create index elements_modifie_par_idx on public.elements (modifie_par);
-- Un numéro de ticket ou de facture n'existe qu'une fois par magasin.
create unique index elements_ticket_unique on public.elements (magasin_id, (donnees->>'no'))
  where collection = 'tickets' and not supprime;
create unique index elements_facture_unique on public.elements (magasin_id, (donnees->>'no'))
  where collection = 'invoices' and not supprime;

-- Le serveur décide de ce qui est privé, pas le téléphone.
-- buys, pays, ops : achats, paiements fournisseurs, journal.
-- stock$, units$, tickets$ : la part « coût » d'un article, d'une unité, d'un ticket.
create function prive.element_avant() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.prive := new.collection in ('buys', 'pays', 'ops', 'stock$', 'units$', 'tickets$');
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
create trigger element_avant before insert or update on public.elements
  for each row execute function prive.element_avant();

-- Aucune politique de suppression : un élément se marque supprimé, il ne disparaît pas.
alter table public.elements enable row level security;

create policy "lire" on public.elements for select to authenticated
  using (prive.est_membre(magasin_id) and (not prive or prive.voit_couts(magasin_id)));
create policy "ajouter" on public.elements for insert to authenticated
  with check (prive.peut_ecrire(magasin_id));
create policy "modifier" on public.elements for update to authenticated
  using (prive.peut_ecrire(magasin_id) and (not prive or prive.voit_couts(magasin_id)))
  with check (prive.peut_ecrire(magasin_id));

-------------------------------------------------------------------------------
-- Magasins et équipe
-------------------------------------------------------------------------------

-- Les magasins dont je suis membre, avec mon rôle.
create function public.mes_magasins()
returns table (id uuid, nom text, role text)
language sql stable security definer set search_path = '' as $$
  select m.id, m.nom, mb.role from public.magasins m
    join public.membres mb on mb.magasin_id = m.id
   where mb.user_id = auth.uid()
   order by m.cree_le
$$;

-- L'équipe d'un magasin, avec les adresses e-mail.
create function public.equipe(m uuid)
returns table (user_id uuid, email text, role text, moi boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not prive.est_membre(m) then raise exception 'Vous ne faites pas partie de ce magasin.'; end if;
  return query
    select mb.user_id, u.email::text, mb.role, mb.user_id = auth.uid()
      from public.membres mb join auth.users u on u.id = mb.user_id
     where mb.magasin_id = m
     order by mb.cree_le;
end $$;

-- Le patron ajoute quelqu'un qui a déjà créé son compte.
create function public.ajouter_membre(m uuid, courriel text, r text)
returns void
language plpgsql security definer set search_path = '' as $$
declare u uuid;
begin
  if not prive.est_patron(m) then raise exception 'Seul le patron ajoute quelqu''un à l''équipe.'; end if;
  if r not in ('patron', 'vendeur', 'comptable') then raise exception 'Rôle inconnu.'; end if;
  select id into u from auth.users where lower(email) = lower(trim(courriel));
  if u is null then
    raise exception 'Aucun compte avec cette adresse. Demandez-lui de créer son compte dans l''application, puis recommencez.';
  end if;
  insert into public.membres (magasin_id, user_id, role) values (m, u, r)
  on conflict (magasin_id, user_id) do update set role = excluded.role;
end $$;

-- Un magasin garde toujours au moins un patron.
create function prive.dernier_patron() returns trigger
language plpgsql security definer set search_path = '' as $$
declare m uuid := old.magasin_id;
begin
  if old.role = 'patron' and (tg_op = 'DELETE' or new.role <> 'patron')
     and exists (select 1 from public.magasins where id = m)
     and not exists (select 1 from public.membres
                      where magasin_id = m and role = 'patron' and user_id <> old.user_id) then
    raise exception 'Le magasin doit garder au moins un patron.';
  end if;
  return coalesce(new, old);
end $$;
create trigger dernier_patron before update or delete on public.membres
  for each row execute function prive.dernier_patron();

revoke execute on function prive.element_avant(), prive.dernier_patron()
  from public, anon, authenticated;
revoke execute on function public.mes_magasins(), public.equipe(uuid), public.ajouter_membre(uuid, text, text)
  from public, anon;
grant execute on function public.mes_magasins(), public.equipe(uuid), public.ajouter_membre(uuid, text, text)
  to authenticated;
