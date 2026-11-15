# Contexte du produit

## D'où ça vient

Le projet est né d'une question : que construire pour les vendeurs de
trottinettes électriques à Tanger. Le choix a été de ne pas faire une place de
marché — Avito occupe déjà ce terrain et une place de marché ne vaut rien tant
qu'elle n'a pas les deux côtés — mais un outil de gestion vendu magasin par
magasin, utile dès le premier client.

## Pour qui

Un patron de magasin de trottinettes, et son vendeur. Petite structure, un ou
deux téléphones, pas d'ordinateur en boutique, clientèle qui négocie et qui
achète souvent à crédit.

## Ce que la recherche a montré

Observé sur les annonces marocaines publiques, en novembre 2026 :

- Les prix à Tanger vont d'environ 2 200 DH pour un modèle d'entrée à 23 000 DH
  pour un modèle très puissant.
- Les vendeurs promettent la livraison dans tout le Maroc avec paiement à la
  réception, et renvoient vers WhatsApp.
- Beaucoup annoncent une garantie, un certificat de vente et un service
  après-vente : il leur faut donc une trace de chaque vente.
- Un décret récent a donné une définition légale à la trottinette électrique,
  avec une vitesse comprise entre 6 et 25 km/h. Beaucoup de modèles vendus
  dépassent cette limite ; les vendeurs auront des questions là-dessus.

Ce qui reste une hypothèse, faute d'avoir interrogé les vendeurs : que le suivi
des crédits impayés soit leur premier problème. C'est le pari sur lequel
l'application est construite, et c'est la première chose à vérifier sur le
terrain.

## Les choix de produit, et pourquoi

| Choix | Raison |
| --- | --- |
| Gestion, pas place de marché | Utile avec un seul client, vendable magasin par magasin |
| Tout dans le téléphone, sans serveur | Montrable en boutique sans rien installer ; la limite est assumée |
| Saisie par listes, jamais par frappe libre | La qualité des données tient à ça |
| Un QR par article, pas par unité | C'est l'objet que le vendeur manipule et colle |
| Facture professionnelle, pas ticket de caisse | Les mentions marocaines sont attendues par les clients entreprises |
| Deux rôles, patron et vendeur | Le patron ne confie pas ses marges à son vendeur |

## La facturation au Maroc

Les mentions reprises dans l'application viennent de l'article 145 du Code
général des impôts : identification du vendeur avec ICE, IF, TP et RC,
identification du client avec son ICE s'il s'agit d'une entreprise,
numérotation chronologique continue, date, détail des lignes, ventilation de la
TVA, total. Un auto-entrepreneur facture sans TVA et doit l'écrire.

Ce travail n'a pas été relu par un comptable. À faire valider avant qu'un
magasin s'en serve pour de vrai.

## Modèle économique envisagé

Abonnement mensuel de l'ordre de 100 à 200 DH, le catalogue gratuit servant
d'accroche. Chiffre non validé : la question à poser aux vendeurs est « combien
ça vaut pour vous par mois », sans avancer de prix le premier.

## L'état de la validation

Aucun vendeur n'a encore été interrogé en profondeur. La démonstration sert
autant à vendre qu'à apprendre : ce qu'un patron demande en plus, et ce qu'il
ignore, vaut plus que son compliment.
