-- Daftar : le magasin vend des trottinettes, des vélos, des scooters et des motos électriques.
-- Types : t trottinette, v vélo électrique, s scooter électrique, m moto électrique, p pièce ou accessoire.
-- Tout ce qui n'est pas « p » est un véhicule, suivi unité par unité avec son numéro de série.
alter table public.catalogue drop constraint catalogue_type_check;
alter table public.catalogue add constraint catalogue_type_check check (type in ('t', 'v', 's', 'm', 'p'));
