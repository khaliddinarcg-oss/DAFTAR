# Feuille de route

Où on en est, d'où on vient, où on va. Mise à jour à chaque étape terminée.

```
 FAIT                          EN COURS              À VENIR
 ─────────────────────────────┬─────────────────────┬──────────────────────────────────────
 Application de démonstration │ 1. Serveur          │ 2. Bibliothèque produits + OCR
 Base de données (fondation)  │    et comptes       │ 3. Devis → vente → facture → avoir
                              │                     │ 4. Fiche client
                              │                     │ 5. Impression thermique
                              │                     │ 6. Envois WhatsApp automatiques
                              │                     │ 7. Multi-magasin
                              │                     │ 8. Côté fournisseur complet
```

## Ce qui est fait

### L'application de démonstration — avant novembre 2026

Une page web autonome (`index.html`), installable sur l'écran d'accueil,
utilisable hors connexion. Les données vivent dans le téléphone.

- Stock : articles avec fiche technique et photo, unités avec numéro de série,
  réceptions, fournisseurs, inventaire.
- Étiquettes QR, une par article, imprimables (`tools/etiquettes.py`).
- Vente : scan du QR, panier à plusieurs lignes, prix modifiable par ligne,
  retrait d'une ligne, comptant, crédit, livraison.
- Après-vente : retour, échange, avoir, réparations.
- Factures A4 numérotées sans trou, montant en lettres, mentions marocaines.
- Journal, analyse, export Excel et CSV.
- Deux rôles, patron et vendeur, séparés à l'affichage seulement.
- Magasin de démonstration Tanja Trott.

### La correction du scan — novembre 2026

Un remaniement avait supprimé `resolveCode` : l'application lisait le QR puis
s'arrêtait sans rien dire. Corrigé, et `test/smoke.js` a été écrit pour que ça
ne se reproduise pas.

### La base de données — 15 novembre 2026

Supabase, offre gratuite, région Paris. 21 tables qui reprennent tout ce que
l'application garde aujourd'hui, plus trois nouveautés : le **catalogue
partagé** entre magasins, les **membres** avec trois rôles (patron, vendeur,
comptable) et les **mouvements de stock**.

Les règles importantes sont appliquées par la base elle-même : numérotation
des factures sans trou, factures non modifiables, remise du vendeur plafonnée,
prix d'achat invisibles pour le vendeur. 20 contrôles passés avec des comptes
fictifs. Détails dans `docs/base-de-donnees.md`.

**Rien n'a changé pour l'utilisateur** : l'application n'est pas encore
branchée sur la base.

## Où on en est

### 1. Serveur et comptes — en cours

Fait : la base, les rôles, les règles d'accès.

Reste à faire, dans l'ordre :

1. **Connexion** : chaque personne a son compte (adresse e-mail ou téléphone).
   Le patron crée son magasin et invite son vendeur.
2. **Reprise des données** : ce que le téléphone contient déjà passe dans la
   base, une fois, sans perte.
3. **Enregistrement côté serveur** : une vente marque l'unité vendue, inscrit
   le mouvement de stock et l'écriture au journal en une seule opération.
4. **Synchronisation** : deux téléphones du même magasin voient le même stock.
   L'application continue de marcher sans réseau et rattrape au retour.
5. **Vérification** : `test/smoke.js` étendu à la connexion et à deux
   téléphones.

Résultat attendu, visible : le patron et le vendeur se connectent sur leurs
téléphones et voient le même magasin ; perdre un téléphone ne fait rien perdre.

## Où on va

### 2. La bibliothèque produits et l'OCR

Le point de départ de toute donnée correcte.

- Photographier la fiche technique : l'IA remplit les champs (marque, modèle,
  moteur, batterie, autonomie, vitesse, poids, garantie). L'utilisateur
  corrige et valide ; rien n'entre sans lui.
- Ou taper une référence : l'IA cherche la fiche chez le fabricant.
- Photo du produit prise en boutique. La photo de la fiche source est gardée
  avec l'article.
- Une fiche validée par un magasin sert à tous les autres.

Coût estimé : moins d'un centime de dirham par fiche avec un modèle économique,
quelques dizaines de centimes avec le plus précis. Demande le serveur, qui
garde la clé de l'IA.

### 3. Le devis

Cycle complet : devis (envoyé, accepté, refusé, expiré) → vente → facture →
avoir. Le devis ne touche pas au stock ; c'est la vente qui le sort.

### 4. La fiche client

Le nom et le téléphone ne sont plus recopiés à chaque vente. Historique des
achats, crédits et réparations par client ; relances groupées.

### 5. L'impression directe

Imprimante thermique Bluetooth, rouleaux 58 et 80 mm, pour les tickets et les
étiquettes QR, sans passer par un PDF.

### 6. Les envois automatiques

Rappels d'échéance par WhatsApp Business API ; facture envoyée en pièce
jointe.

### 7. Le multi-magasin

Un patron, plusieurs boutiques, un stock par boutique, des transferts. La base
le permet déjà : un compte peut être membre de plusieurs magasins.

### 8. Le côté fournisseur complet

Commandes avant réception, délais promis, retours au fournisseur, prix d'achat
qui varie d'un envoi à l'autre.

## Avant les premiers vrais clients

- Passer Supabase à l'offre payante (environ 250 DH par mois) : pas de mise en
  pause, sauvegardes complètes.
- Déclarer le traitement des données clients à la CNDP (loi 09-08).
- Tester sur un vrai téléphone ce qui ne l'a jamais été : l'impression, le
  fichier Excel, la caméra en direct.

## Questions encore ouvertes

- **Recherche d'image sur le web** : fragile (API payante, droits d'auteur).
  La photo prise en boutique couvre le besoin pour l'instant.
- **Application installée ou site web** : l'application web installée sur
  l'écran d'accueil reste le compromis ; à revoir si l'impression Bluetooth
  l'exige.
- **Ce que les vendeurs réclament** : l'ordre ci-dessus est à confronter aux
  démonstrations en boutique.
