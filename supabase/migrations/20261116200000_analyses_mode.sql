-- Daftar : le journal des analyses distingue la lecture d'une fiche produit et celle d'un bon d'achat.
alter table public.analyses add column mode text not null default 'fiche' check (mode in ('fiche', 'achat'));
