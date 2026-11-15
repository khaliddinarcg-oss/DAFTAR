# La base de données

Supabase, offre gratuite, projet `daftar`, région Paris (eu-west-3).
Identifiant du projet : `gfxpvuhfuarllqopbwlw`.

Créée le 15 novembre 2026. **L'application n'y est pas encore branchée** :
elle tourne toujours sur le `localStorage` du téléphone. La base est vide.

Les migrations sont dans `supabase/migrations/`, dans l'ordre où elles ont été
appliquées. Toute modification passe par une nouvelle migration ; on ne
réécrit pas une migration déjà appliquée.

## Le schéma

```
                ┌──────────────────────────┐
                │ catalogue (partagé)      │  marque, modèle, type,
                │ la bibliothèque produits │  fiche technique, photo, source
                └────────────┬─────────────┘
 ┌──────────┐   ┌────────────▼─────────────┐   ┌──────────────┐
 │ magasins │──▶│ articles du magasin      │──▶│ unites       │ n° de série, état
 │ membres  │   │ réf, prix, seuil,        │   └──────────────┘
 └──────────┘   │ garantie, quantité       │
                │ (couts_articles à part)  │
                └────────────┬─────────────┘
   achats ◀─────┤ mouvements_stock         ├─────▶ ventes + lignes_vente
   paiements_   └──────────────────────────┘        │  credits, livraisons,
   fournisseurs                                     │  retours, reparations
                                                    ▼
                                          factures (facture ou avoir)
                              journal : toutes les entrées et sorties d'argent
```

| Table | Ce qu'elle contient | Équivalent dans `S` |
| --- | --- | --- |
| `magasins` | Nom, adresse, ICE, IF, patente, RC, TVA, logo, remise max du vendeur, délai de retour | `shop`, `info`, `rules` |
| `membres` | Qui appartient à quel magasin, avec quel rôle | — (nouveau) |
| `catalogue` | Une fiche par modèle, commune à tous les magasins | partie de `stock` |
| `articles` | Ce que le magasin vend : référence, prix, seuil, garantie | `stock` |
| `couts_articles` | Prix d'achat courant | `stock[].cost` |
| `unites` | Une ligne par trottinette physique | `units` |
| `fournisseurs` | Nom, téléphone, ville, note | `sups` |
| `achats` | Réceptions, avec le coût unitaire | `buys` |
| `paiements_fournisseurs` | Paiements, un achat à crédit se paie en plusieurs fois | `pays` |
| `ventes`, `lignes_vente` | Tickets et leurs lignes | `tickets` |
| `couts_lignes` | Coût de chaque ligne, figé au jour de la vente | `tickets[].lines[].cost` |
| `credits` | Montant, payé, tranche, échéance | `credits` |
| `livraisons` | Ville, transporteur, statut | `dels` |
| `retours` | Motif, destination (stock ou atelier), remboursé | `tickets[].ret` |
| `reparations` | Travaux après-vente | `sales[].repairs` |
| `factures` | Factures et avoirs, lignes figées | `invoices` |
| `mouvements_stock` | Chaque entrée ou sortie de stock, avec son motif | — (nouveau) |
| `journal` | Entrées et sorties d'argent | `ops` |
| `prospects` | Clients intéressés, pas encore acheteurs | `leads` |
| `compteurs` | Numéros de ticket, facture, avoir | `seq`, `fseq`, `aseq` |

Photos du catalogue : dossier de stockage `catalogue`, public en lecture,
5 Mo maximum, JPEG, PNG ou WebP.

## Les rôles

| | Patron | Vendeur | Comptable |
| --- | --- | --- | --- |
| Articles, stock, ventes, crédits, livraisons, retours | lit, écrit, supprime | lit, écrit | lit |
| Prix d'achat, achats, paiements fournisseurs, coûts des ventes | lit, écrit | **rien** | lit |
| Journal | lit, écrit | écrit sans relire | lit |
| Factures et avoirs | émet, lit | émet sans relire | lit |
| Équipe du magasin | gère | voit | voit |
| Réglages du magasin | modifie | — | — |
| Catalogue partagé | lit, ajoute, corrige ses fiches | lit, ajoute | lit |

Celui qui crée un magasin en devient le patron. Un compte ne voit que les
magasins dont il est membre ; seul le catalogue est commun à tous.

## Les règles que la base applique elle-même

Elles ne dépendent pas de l'écran : même une application modifiée ne peut pas
les contourner.

- **Numéros sans trou.** `T-0001`, `F-2026-0001`, `A-2026-0001` sont donnés
  par le serveur, par magasin. Deux téléphones ne produisent jamais le même
  numéro.
- **Factures intouchables.** Ni modification ni suppression, même pour un
  administrateur. Une seule facture et un seul avoir par ticket. Un avoir
  cite toujours sa facture d'origine. Une facture B2B porte un ICE de
  15 chiffres.
- **Remise du vendeur plafonnée.** Une ligne vendue sous le prix moins la
  remise maximale du magasin est refusée, avec le prix minimum dans le message.
- **Une unité vendue doit être en stock.**
- **Le coût d'une vente est calculé par le serveur**, depuis l'achat de
  l'unité ou le prix d'achat courant. Le téléphone du vendeur ne le reçoit pas.
- **Plafonds de `docs/regles.md`** : prix entre 1 et 500 000 DH, réception de
  50 unités au plus, numéro de série unique par magasin, article en double
  refusé (même marque, même modèle, même type), encaissement de crédit
  jamais au-dessus du montant, réparation jamais datée dans le futur.

Les fonctions internes (contrôle des rôles, numérotation) sont dans le schéma
`prive`, que l'API n'expose pas.

## Vérifié le 15 novembre 2026

Avec un patron, un vendeur et un inconnu fictifs, dans une transaction annulée
ensuite : 20 contrôles passés. Le vendeur ne voit ni coûts ni achats, ne
supprime rien, ne peut pas accorder 15 % de remise ; l'inconnu ne voit aucun
magasin ; les numéros sortent `T-0001`, `F-2026-0001`, `A-2026-0001` ; une
deuxième facture sur le même ticket est refusée ; une facture modifiée par
l'application reste inchangée, et un administrateur se voit refuser la
modification.

Contrôles de sécurité de Supabase : une seule remarque restante, voulue — la
table `compteurs` n'a aucune politique, donc personne n'y accède sauf le
serveur.

## Ce qui reste ouvert

- **Stock et journal ne se mettent pas encore à jour seuls.** Marquer l'unité
  vendue, inscrire le mouvement de stock et l'écriture au journal reste, pour
  l'instant, le travail de l'application. À passer côté serveur, en une seule
  opération, quand l'application sera branchée : une vente ne doit jamais être
  à moitié enregistrée.
- **Le dernier patron peut se retirer** du magasin. À interdire.
- **Le catalogue partagé n'a pas de modération.** Chaque magasin corrige ses
  propres fiches ; les fiches des autres ne se corrigent pas encore.
- **Offre gratuite** : le projet se met en pause après environ une semaine
  sans activité, et les sauvegardes sont limitées. Passer à l'offre payante
  avant le premier magasin qui travaille pour de vrai.
- **Loi 09-08** : déclarer le traitement des données clients à la CNDP avant
  les premiers vrais clients.

## Clés

L'application utilisera l'adresse du projet et la clé publique (`anon` ou
`sb_publishable_…`), faites pour être visibles dans le code : ce sont les
règles ci-dessus qui protègent les données. La clé `service_role` ne doit
jamais apparaître dans le code ni dans une conversation.
