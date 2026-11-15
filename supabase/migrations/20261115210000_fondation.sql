-- Daftar : fondation de la base
-- Reprend l'objet S de index.html, table par table.
-- Montants en dirhams entiers. Dates métier en `date`, horodatages en `timestamptz`.

-------------------------------------------------------------------------------
-- 1. Magasins, membres, rôles
-------------------------------------------------------------------------------

create table public.magasins (
  id            uuid primary key default gen_random_uuid(),
  nom           text not null check (length(trim(nom)) > 0),
  adresse       text not null default '',
  telephone     text not null default '',
  ice           text not null default '' check (ice = '' or ice ~ '^[0-9]{15}$'),
  identifiant_fiscal text not null default '',
  patente       text not null default '',
  rc            text not null default '',
  tva           integer not null default 0 check (tva between 0 and 100),
  logo_url      text not null default '',
  remise_max_vendeur integer not null default 10 check (remise_max_vendeur between 0 and 100),
  delai_retour_jours integer not null default 7 check (delai_retour_jours between 0 and 365),
  cree_par      uuid not null default auth.uid() references auth.users(id),
  cree_le       timestamptz not null default now()
);

-- patron : tout ; vendeur : vend, sans prix d'achat ni suppression ;
-- comptable : lit tout, n'écrit rien.
create table public.membres (
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('patron', 'vendeur', 'comptable')),
  nom        text not null default '',
  cree_le    timestamptz not null default now(),
  primary key (magasin_id, user_id)
);
create index membres_user_idx on public.membres(user_id);

create function public.role_dans(m uuid) returns text
language sql stable security definer set search_path = '' as $$
  select role from public.membres where magasin_id = m and user_id = auth.uid()
$$;
create function public.est_membre(m uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.role_dans(m) is not null
$$;
create function public.peut_ecrire(m uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.role_dans(m) in ('patron', 'vendeur'), false)
$$;
create function public.est_patron(m uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.role_dans(m) = 'patron', false)
$$;
create function public.voit_couts(m uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.role_dans(m) in ('patron', 'comptable'), false)
$$;

-- Celui qui crée un magasin en devient le patron.
create function public.magasin_cree() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.membres (magasin_id, user_id, role) values (new.id, new.cree_par, 'patron');
  return new;
end $$;
create trigger magasin_cree after insert on public.magasins
  for each row execute function public.magasin_cree();

-------------------------------------------------------------------------------
-- 2. Catalogue partagé : la bibliothèque produits
-------------------------------------------------------------------------------

-- Une fiche par modèle, commune à tous les magasins.
-- type : 't' trottinette, 'p' pièce ou accessoire (comme kind dans index.html).
create table public.catalogue (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('t', 'p')),
  marque      text not null default '',
  modele      text not null check (length(trim(modele)) > 0),
  fiche       jsonb not null default '{}'::jsonb,   -- moteur, batterie, autonomie, vitesse, roues, poids, charge…
  photo_url   text not null default '',
  source      text not null default 'manuel' check (source in ('manuel', 'ocr', 'web')),
  source_url  text not null default '',             -- page fabricant, ou photo de la fiche technique gardée
  cree_par_magasin uuid references public.magasins(id) on delete set null,
  cree_le     timestamptz not null default now(),
  modifie_le  timestamptz not null default now()
);
-- « Article en double » : même marque, même modèle, même type.
create unique index catalogue_unique on public.catalogue (type, lower(trim(marque)), lower(trim(modele)));

-------------------------------------------------------------------------------
-- 3. Stock du magasin
-------------------------------------------------------------------------------

create table public.fournisseurs (
  id         uuid primary key default gen_random_uuid(),
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  nom        text not null check (length(trim(nom)) > 0),
  telephone  text not null default '',
  ville      text not null default '',
  note       text not null default '',
  cree_le    timestamptz not null default now()
);
create index fournisseurs_magasin_idx on public.fournisseurs(magasin_id);

create table public.articles (
  id          uuid primary key default gen_random_uuid(),
  magasin_id  uuid not null references public.magasins(id) on delete cascade,
  catalogue_id uuid not null references public.catalogue(id),
  reference   text not null default '',
  prix        integer not null check (prix > 0 and prix <= 500000),
  seuil       integer not null default 0 check (seuil >= 0),
  garantie_mois integer not null default 0 check (garantie_mois between 0 and 120),
  quantite    integer not null default 0 check (quantite >= 0), -- pièces seulement ; les trottinettes se comptent en unités
  actif       boolean not null default true,
  cree_le     timestamptz not null default now(),
  unique (magasin_id, catalogue_id)
);
create unique index articles_reference_unique on public.articles (magasin_id, lower(reference)) where reference <> '';

-- Prix d'achat courant : à part, pour que le vendeur ne le reçoive jamais.
create table public.couts_articles (
  article_id uuid primary key references public.articles(id) on delete cascade,
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  cout       integer not null check (cout >= 0)
);

-- Réceptions. Un achat à crédit n'écrit rien au journal : la sortie d'argent
-- s'inscrit au paiement (paiements_fournisseurs).
create table public.achats (
  id            uuid primary key default gen_random_uuid(),
  magasin_id    uuid not null references public.magasins(id) on delete cascade,
  fournisseur_id uuid references public.fournisseurs(id),
  article_id    uuid not null references public.articles(id),
  quantite      integer not null check (quantite between 1 and 50),
  cout_unitaire integer not null check (cout_unitaire >= 0),
  montant       integer generated always as (quantite * cout_unitaire) stored,
  a_credit      boolean not null default false,
  date_reception date not null default current_date,
  cree_le       timestamptz not null default now()
);
create index achats_magasin_idx on public.achats(magasin_id);

create table public.paiements_fournisseurs (
  id         uuid primary key default gen_random_uuid(),
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  achat_id   uuid not null references public.achats(id),
  montant    integer not null check (montant > 0),
  date_paiement date not null default current_date,
  cree_le    timestamptz not null default now()
);
create index paiements_fournisseurs_achat_idx on public.paiements_fournisseurs(achat_id);

-- Une ligne par trottinette physique. Le coût de l'unité se lit dans l'achat.
create table public.unites (
  id          uuid primary key default gen_random_uuid(),
  magasin_id  uuid not null references public.magasins(id) on delete cascade,
  article_id  uuid not null references public.articles(id),
  achat_id    uuid references public.achats(id),
  numero_serie text not null check (length(trim(numero_serie)) > 0),
  etat        text not null default 'stock' check (etat in ('stock', 'vendu', 'atelier', 'manquant')),
  date_entree date not null default current_date,
  cree_le     timestamptz not null default now(),
  unique (magasin_id, numero_serie)
);
create index unites_article_idx on public.unites(article_id);

-------------------------------------------------------------------------------
-- 4. Ventes
-------------------------------------------------------------------------------

-- Numéros continus par magasin (tickets, factures, avoirs), donnés par le
-- serveur : deux téléphones ne produisent jamais le même numéro.
create table public.compteurs (
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  nom        text not null,
  valeur     integer not null,
  primary key (magasin_id, nom)
);

create function public.prochain_numero(m uuid, n text) returns integer
language plpgsql security definer set search_path = '' as $$
declare v integer;
begin
  insert into public.compteurs (magasin_id, nom, valeur) values (m, n, 1)
  on conflict (magasin_id, nom) do update set valeur = public.compteurs.valeur + 1
  returning valeur into v;
  return v;
end $$;
revoke execute on function public.prochain_numero(uuid, text) from public, anon, authenticated;

create table public.ventes (
  id          uuid primary key default gen_random_uuid(),
  magasin_id  uuid not null references public.magasins(id) on delete cascade,
  numero      text not null default '',              -- T-0001, donné par le serveur
  date_vente  date not null default current_date,
  vendeur_id  uuid not null default auth.uid() references auth.users(id),
  client_nom  text not null default 'Client comptoir',
  client_telephone text not null default '',
  paiement    text not null default 'comptant' check (paiement in ('comptant', 'credit', 'livraison')),
  total       integer not null default 0 check (total >= 0),
  statut      text not null default 'ok' check (statut in ('ok', 'retourne', 'echange')),
  liee_a      uuid references public.ventes(id),     -- vente d'origine d'un échange
  cree_le     timestamptz not null default now(),
  unique (magasin_id, numero)
);
create index ventes_magasin_date_idx on public.ventes(magasin_id, date_vente);

create function public.vente_numero() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.numero := 'T-' || lpad(public.prochain_numero(new.magasin_id, 'ticket')::text, 4, '0');
  return new;
end $$;
create trigger vente_numero before insert on public.ventes
  for each row execute function public.vente_numero();

create table public.lignes_vente (
  id          uuid primary key default gen_random_uuid(),
  vente_id    uuid not null references public.ventes(id) on delete cascade,
  magasin_id  uuid not null references public.magasins(id) on delete cascade,
  article_id  uuid not null references public.articles(id),
  unite_id    uuid references public.unites(id),
  quantite    integer not null default 1 check (quantite > 0),
  prix_unitaire integer not null check (prix_unitaire > 0 and prix_unitaire <= 500000),
  total       integer generated always as (quantite * prix_unitaire) stored,
  garantie_mois integer not null default 0,
  check (unite_id is null or quantite = 1)
);
create index lignes_vente_vente_idx on public.lignes_vente(vente_id);

-- Coût de chaque ligne, figé au moment de la vente. Patron et comptable seulement.
create table public.couts_lignes (
  ligne_id   uuid primary key references public.lignes_vente(id) on delete cascade,
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  cout       integer not null check (cout >= 0)
);

-- Règles vérifiées par le serveur à chaque ligne :
-- l'unité doit être en stock, la remise du vendeur ne dépasse pas le plafond.
-- Le coût est calculé ici, sans passer par le téléphone du vendeur.
create function public.ligne_controle() returns trigger
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
  if not public.est_patron(new.magasin_id) then
    select m.remise_max_vendeur into r from public.magasins m where m.id = new.magasin_id;
    if new.prix_unitaire * 100 < p * (100 - r) then
      raise exception 'Remise trop forte : le prix minimum est % DH.', ceil(p * (100 - r) / 100.0)::integer;
    end if;
  end if;
  return new;
end $$;
create trigger ligne_controle before insert or update on public.lignes_vente
  for each row execute function public.ligne_controle();

create function public.ligne_cout() returns trigger
language plpgsql security definer set search_path = '' as $$
declare c integer;
begin
  if new.unite_id is not null then
    select ac.cout_unitaire into c from public.unites u join public.achats ac on ac.id = u.achat_id
     where u.id = new.unite_id;
  end if;
  if c is null then
    select ca.cout into c from public.couts_articles ca where ca.article_id = new.article_id;
  end if;
  insert into public.couts_lignes (ligne_id, magasin_id, cout)
  values (new.id, new.magasin_id, coalesce(c, 0) * new.quantite)
  on conflict (ligne_id) do update set cout = excluded.cout;
  return new;
end $$;
create trigger ligne_cout after insert or update on public.lignes_vente
  for each row execute function public.ligne_cout();

-- Vente à crédit : avance, tranche, échéance. Les encaissements vont au journal.
create table public.credits (
  vente_id   uuid primary key references public.ventes(id) on delete cascade,
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  montant    integer not null check (montant > 0),
  paye       integer not null default 0 check (paye >= 0),
  tranche    integer not null default 0 check (tranche >= 0),
  echeance   date,
  check (paye <= montant)                 -- un encaissement ne dépasse jamais le reste dû
);

create table public.livraisons (
  vente_id   uuid primary key references public.ventes(id) on delete cascade,
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  ville      text not null check (length(trim(ville)) > 0),
  transporteur text not null default '',
  statut     text not null default 'prepare' check (statut in ('prepare', 'envoye', 'livre', 'encaisse', 'retour'))
);

create table public.retours (
  vente_id   uuid primary key references public.ventes(id),   -- un seul retour par ticket
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  date_retour date not null default current_date,
  motif      text not null default '',
  destination text not null check (destination in ('stock', 'atelier')),  -- revendable ou SAV
  rembourse  integer not null default 0 check (rembourse >= 0),
  cree_le    timestamptz not null default now()
);

create table public.reparations (
  id         uuid primary key default gen_random_uuid(),
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  vente_id   uuid references public.ventes(id),
  date_reparation date not null default current_date check (date_reparation <= current_date),
  travail    text not null,
  prix       integer not null default 0 check (prix >= 0)
);

-------------------------------------------------------------------------------
-- 5. Factures et avoirs : numérotés sans trou, jamais modifiés ni supprimés
-------------------------------------------------------------------------------

create table public.factures (
  id          uuid primary key default gen_random_uuid(),
  magasin_id  uuid not null references public.magasins(id) on delete restrict,
  type        text not null check (type in ('facture', 'avoir')),
  numero      text not null default '',               -- F-2026-0001 ou A-2026-0001
  date_emission date not null default current_date,
  vente_id    uuid not null references public.ventes(id),
  facture_origine_id uuid references public.factures(id),
  client_type text not null default 'b2c' check (client_type in ('b2c', 'b2b')),
  client_nom  text not null default '',
  client_adresse text not null default '',
  client_ice  text not null default '' check (client_ice = '' or client_ice ~ '^[0-9]{15}$'),
  lignes      jsonb not null,                         -- copie figée des lignes au jour de l'émission
  total       integer not null,
  tva         integer not null default 0,
  motif       text not null default '',
  cree_le     timestamptz not null default now(),
  unique (magasin_id, numero),
  check ((type = 'avoir') = (facture_origine_id is not null)),
  check (client_type = 'b2c' or client_ice <> '')
);
-- Une seule facture et un seul avoir par ticket.
create unique index factures_une_par_vente on public.factures (vente_id, type);

create function public.facture_numero() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.numero := (case new.type when 'facture' then 'F-' else 'A-' end)
    || to_char(new.date_emission, 'YYYY') || '-'
    || lpad(public.prochain_numero(new.magasin_id, new.type)::text, 4, '0');
  return new;
end $$;
create trigger facture_numero before insert on public.factures
  for each row execute function public.facture_numero();

create function public.facture_immuable() returns trigger
language plpgsql as $$
begin
  raise exception 'Une facture ne se modifie pas et ne se supprime pas : un retour produit un avoir.';
end $$;
create trigger facture_immuable before update or delete on public.factures
  for each row execute function public.facture_immuable();

-------------------------------------------------------------------------------
-- 6. Mouvements de stock et journal
-------------------------------------------------------------------------------

create table public.mouvements_stock (
  id         uuid primary key default gen_random_uuid(),
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  article_id uuid not null references public.articles(id),
  unite_id   uuid references public.unites(id),
  quantite   integer not null check (quantite <> 0),     -- + entrée, − sortie
  motif      text not null check (motif in ('reception', 'vente', 'retour', 'echange', 'inventaire', 'correction')),
  vente_id   uuid references public.ventes(id),
  achat_id   uuid references public.achats(id),
  date_mouvement date not null default current_date,
  par        uuid not null default auth.uid() references auth.users(id),
  cree_le    timestamptz not null default now()
);
create index mouvements_article_idx on public.mouvements_stock(article_id, date_mouvement);

-- Toutes les entrées et sorties d'argent. On n'efface pas : on corrige par une
-- écriture inverse.
create table public.journal (
  id         uuid primary key default gen_random_uuid(),
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  date_operation date not null default current_date,
  type       text not null check (type in ('vente', 'encaissement', 'remboursement', 'achat', 'depense', 'reparation', 'autre')),
  libelle    text not null,
  montant    integer not null,                    -- + entrée, − sortie
  vente_id   uuid references public.ventes(id),
  achat_id   uuid references public.achats(id),
  par        uuid not null default auth.uid() references auth.users(id),
  cree_le    timestamptz not null default now()
);
create index journal_magasin_date_idx on public.journal(magasin_id, date_operation);

-------------------------------------------------------------------------------
-- 7. Prospects (leads)
-------------------------------------------------------------------------------

create table public.prospects (
  id         uuid primary key default gen_random_uuid(),
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  nom        text not null,
  telephone  text not null default '',
  modele     text not null default '',
  source     text not null default '',
  statut     text not null default 'nouveau',
  dernier_contact date not null default current_date
);

-------------------------------------------------------------------------------
-- 8. Règles d'accès (RLS)
-------------------------------------------------------------------------------

alter table public.magasins              enable row level security;
alter table public.membres               enable row level security;
alter table public.catalogue             enable row level security;
alter table public.fournisseurs          enable row level security;
alter table public.articles              enable row level security;
alter table public.couts_articles        enable row level security;
alter table public.achats                enable row level security;
alter table public.paiements_fournisseurs enable row level security;
alter table public.unites                enable row level security;
alter table public.compteurs             enable row level security;  -- aucune politique : serveur seulement
alter table public.ventes                enable row level security;
alter table public.lignes_vente          enable row level security;
alter table public.couts_lignes          enable row level security;
alter table public.credits               enable row level security;
alter table public.livraisons            enable row level security;
alter table public.retours               enable row level security;
alter table public.reparations           enable row level security;
alter table public.factures              enable row level security;
alter table public.mouvements_stock      enable row level security;
alter table public.journal               enable row level security;
alter table public.prospects             enable row level security;

-- Magasins
create policy "lire son magasin" on public.magasins for select to authenticated
  using (public.est_membre(id) or cree_par = (select auth.uid()));
create policy "créer un magasin" on public.magasins for insert to authenticated
  with check (cree_par = (select auth.uid()));
create policy "le patron règle le magasin" on public.magasins for update to authenticated
  using (public.est_patron(id)) with check (public.est_patron(id));

-- Membres : chacun voit l'équipe, seul le patron la change.
create policy "voir l'équipe" on public.membres for select to authenticated
  using (public.est_membre(magasin_id));
create policy "le patron ajoute" on public.membres for insert to authenticated
  with check (public.est_patron(magasin_id));
create policy "le patron modifie" on public.membres for update to authenticated
  using (public.est_patron(magasin_id)) with check (public.est_patron(magasin_id));
create policy "le patron retire" on public.membres for delete to authenticated
  using (public.est_patron(magasin_id));

-- Catalogue : lu par tous les comptes, enrichi par tous, corrigé par le magasin qui l'a créé.
create policy "lire le catalogue" on public.catalogue for select to authenticated using (true);
create policy "ajouter au catalogue" on public.catalogue for insert to authenticated
  with check (cree_par_magasin is not null and public.peut_ecrire(cree_par_magasin));
create policy "corriger sa fiche" on public.catalogue for update to authenticated
  using (public.est_patron(cree_par_magasin)) with check (public.est_patron(cree_par_magasin));

-- Tables du magasin visibles par toute l'équipe :
-- lecture par les membres, écriture par patron et vendeur, suppression par le patron.
do $$
declare t text;
begin
  foreach t in array array['fournisseurs', 'articles', 'unites', 'ventes', 'lignes_vente',
                           'credits', 'livraisons', 'retours', 'reparations', 'mouvements_stock', 'prospects']
  loop
    execute format('create policy "lire" on public.%I for select to authenticated using (public.est_membre(magasin_id))', t);
    execute format('create policy "ajouter" on public.%I for insert to authenticated with check (public.peut_ecrire(magasin_id))', t);
    execute format('create policy "modifier" on public.%I for update to authenticated using (public.peut_ecrire(magasin_id)) with check (public.peut_ecrire(magasin_id))', t);
    execute format('create policy "supprimer" on public.%I for delete to authenticated using (public.est_patron(magasin_id))', t);
  end loop;
end $$;

-- Argent et coûts : lus par le patron et le comptable seulement.
do $$
declare t text;
begin
  foreach t in array array['couts_articles', 'achats', 'paiements_fournisseurs']
  loop
    execute format('create policy "lire" on public.%I for select to authenticated using (public.voit_couts(magasin_id))', t);
    execute format('create policy "ajouter" on public.%I for insert to authenticated with check (public.est_patron(magasin_id))', t);
    execute format('create policy "modifier" on public.%I for update to authenticated using (public.est_patron(magasin_id)) with check (public.est_patron(magasin_id))', t);
    execute format('create policy "supprimer" on public.%I for delete to authenticated using (public.est_patron(magasin_id))', t);
  end loop;
end $$;

-- Coûts des lignes : écrits par le serveur, lus par patron et comptable.
create policy "lire" on public.couts_lignes for select to authenticated
  using (public.voit_couts(magasin_id));

-- Journal : le vendeur y inscrit ce qu'il encaisse, sans pouvoir le relire ni l'effacer.
create policy "lire" on public.journal for select to authenticated
  using (public.voit_couts(magasin_id));
create policy "ajouter" on public.journal for insert to authenticated
  with check (public.peut_ecrire(magasin_id));

-- Factures : émises par patron ou vendeur (un retour du vendeur produit un avoir),
-- lues par patron et comptable. Ni modification ni suppression, pour personne.
create policy "lire" on public.factures for select to authenticated
  using (public.voit_couts(magasin_id));
create policy "émettre" on public.factures for insert to authenticated
  with check (public.peut_ecrire(magasin_id));

-------------------------------------------------------------------------------
-- 9. Photos du catalogue et fiches techniques scannées
-------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalogue', 'catalogue', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "déposer une photo" on storage.objects for insert to authenticated
  with check (bucket_id = 'catalogue');
