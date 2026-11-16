# La base de données

Supabase, offre gratuite, projet `daftar`, région Paris (eu-west-3).
Identifiant du projet : `gfxpvuhfuarllqopbwlw`.

Créée le 15 novembre 2026, branchée sur l'application le 16 novembre par la
table `elements` (voir « La synchronisation » plus bas). Sans compte,
l'application marche comme avant, dans le `localStorage` du téléphone.

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

## La synchronisation : table `elements`

C'est elle que l'application utilise aujourd'hui. Chaque élément de l'état `S`
(un article, une unité, un ticket, une facture, une écriture du journal…) est
une ligne : `magasin_id`, `collection`, `cle` (l'identifiant de l'élément),
`donnees` (l'élément en JSON), `supprime`, `version`.

- **Envoi** : à chaque enregistrement, le téléphone compare chaque élément à
  l'empreinte de ce qu'il a déjà envoyé, et n'envoie que ce qui a changé.
- **Réception** : toutes les 20 secondes, au retour du réseau et au retour
  dans l'application, il demande les lignes dont la `version` dépasse la
  dernière reçue.
- **Hors ligne** : rien ne se perd. Les modifications attendent et partent au
  retour du réseau.
- **Deux modifications du même élément** : la dernière envoyée l'emporte.
  Deux encaissements simultanés sur le même crédit, depuis deux téléphones,
  peuvent donc s'écraser ; le journal, lui, garde les deux écritures.
- **Coûts à part** : le prix d'achat d'un article, d'une unité ou d'un ticket
  voyage dans une ligne séparée (`stock$`, `units$`, `tickets$`). Avec les
  achats (`buys`), les paiements fournisseurs (`pays`) et le journal (`ops`),
  ces lignes sont **privées** : le serveur ne les envoie jamais à un vendeur.
  Le vendeur peut en ajouter (l'écriture de sa vente au journal) sans pouvoir
  les relire. Le coût d'une vente faite par le vendeur est calculé ensuite par
  le téléphone du patron.
- **Numéros** : deux tickets ou deux factures du même magasin ne portent
  jamais le même numéro. Si deux téléphones hors ligne ont donné le même, le
  second envoyé prend le numéro libre suivant, et le téléphone l'affiche dans
  Réglages.
- **Factures** : une ligne de facture ou d'avoir ne se modifie pas et ne se
  supprime pas, même par le patron.
- **Réceptions** : une réception (`buys`) datée à partir du 16 novembre 2026
  porte un fournisseur, ou la marque « stock de départ » (`initial`). Les
  anciennes et les réparées (`dateIncertaine`) sont acceptées.
- **Verrous de caisse** : seul le patron change les réglages du magasin (nom,
  facturation, remise maximale, délai de retour) ; un ticket ou une écriture du
  journal ne se supprime jamais ; les montants d'un ticket ne changent plus
  après l'encaissement, même pour le patron.
- **Suppressions** : un élément se marque supprimé, il ne disparaît pas de la
  base. Seul le patron supprime un article ou un fournisseur.

Fonctions appelées par l'application : `mes_magasins()`, `equipe(m)`,
`ajouter_membre(m, courriel, rôle)`. Un magasin garde toujours au moins un
patron.

Les 21 tables de la fondation restent la cible de l'étape « enregistrement
côté serveur » : elles sont prêtes et vides.

## La lecture de fiche par l'IA

Deux modes : `fiche` (fiche technique, carton, catalogue) et `achat` (bon
d'achat ou facture fournisseur). En mode `achat`, la réponse n'a aucun champ
pour les coordonnées du client inscrites sur le document. La colonne `mode`
de la table `analyses` distingue les deux.

Fonction `analyser-fiche` (Edge Function, code dans
`supabase/functions/analyser-fiche/`). L'application lui envoie la photo et le
magasin, avec le jeton de la personne connectée. La fonction :

1. vérifie que la personne est patron ou vendeur de ce magasin ;
2. refuse au-delà de 60 analyses par magasin sur 24 heures ;
3. demande la fiche à Claude Opus 5.5 (effort faible, réponse au format JSON
   imposé, repli automatique sur un autre modèle en cas de refus). Ce qui est
   lu sur la photo est la source ; une caractéristique absente peut être
   déduite du modèle quand il est identifié sans ambiguïté, et elle est alors
   marquée « déduit du modèle » dans l'application. Une marque ou un modèle
   reconnu seulement à l'apparence (forme, logo, sans nom écrit) est toujours
   marqué « à vérifier », et le modèle reste vide si plusieurs se ressemblent ;
4. note chaque analyse dans la table `analyses` (modèle, jetons, erreur),
   lisible par le patron et le comptable.

La clé de l'IA est le secret `ANTHROPIC_API_KEY` du projet, déposé par le
propriétaire du compte. Elle n'apparaît ni dans le code ni dans l'application.
Mesuré le 16 novembre : environ 3 200 jetons en entrée et 200 en sortie par
fiche, soit environ 0,02 $.

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

## Comptes de test

Deux comptes servent à `test/sync.js` : `patron.essai@daftar.test` et
`vendeur.essai@daftar.test`, créés directement dans la base (adresses
fictives, aucun e-mail ne part). Le mot de passe n'est pas dans le dépôt. Le
test crée un magasin « Tanja Trott » qu'il faut supprimer ensuite.

## Ce qui reste ouvert

- **La logique métier tourne encore dans le téléphone.** Le serveur vérifie
  les droits, les numéros et les factures, mais pas les plafonds d'argent ni
  le stock : un téléphone modifié pourrait les contourner. C'est l'étape
  « enregistrement côté serveur ».
- **Stock et journal ne se mettent pas encore à jour seuls** dans les tables
  de la fondation. Marquer l'unité
  vendue, inscrire le mouvement de stock et l'écriture au journal reste, pour
  l'instant, le travail de l'application. À passer côté serveur, en une seule
  opération, quand l'application sera branchée : une vente ne doit jamais être
  à moitié enregistrée.
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
