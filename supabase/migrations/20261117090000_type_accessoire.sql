-- Daftar : les accessoires (casque, antivol, chargeur…) se séparent des pièces détachées.
-- Types : t trottinette, v vélo, s scooter, m moto (véhicules, suivis par numéro de série),
-- p pièce détachée, a accessoire (comptés).
alter table public.catalogue drop constraint catalogue_type_check;
alter table public.catalogue add constraint catalogue_type_check check (type in ('t', 'v', 's', 'm', 'p', 'a'));
