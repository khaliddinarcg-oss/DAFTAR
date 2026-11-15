# Feuille de route

Où on en est, d'où on vient, où on va. Mise à jour à chaque étape terminée.

```
 FAIT                          EN COURS              À VENIR
 ─────────────────────────────┬─────────────────────┬──────────────────────────────────────
 Application de démonstration │ 1. Serveur          │ 2. Bibliothèque produits + OCR
 Base de données (fondation)  │    et comptes :     │ 3. Devis → vente → facture → avoir
 Comptes et synchronisation   │    essai terrain    │
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

### Les comptes et la synchronisation — 16 novembre 2026

Dans Réglages, une carte « Compte en ligne » :

- **Créer un compte, se connecter** par adresse e-mail et mot de passe.
- **Mettre ce magasin en ligne** : le patron envoie tout ce que son téléphone
  contient. C'est la reprise des données, sans perte.
- **Équipe** : le patron ajoute son vendeur par son adresse e-mail, choisit
  son rôle (vendeur, comptable, patron), peut le retirer.
- **Ouvrir le magasin** sur un autre téléphone : tout revient.
- **Synchronisation** : chaque modification part au serveur ; celles des
  autres arrivent toutes les 20 secondes. Hors ligne, rien ne se perd.
- Le **vendeur** ne reçoit jamais les prix d'achat, les achats ni le journal,
  et ne peut pas repasser en patron.

Vérifié par `test/sync.js` avec trois téléphones simulés contre la vraie base :
18 contrôles passés, dont une vente du vendeur vue par le patron avec son coût,
deux ventes hors ligne au même numéro correctement renumérotées, et un
téléphone perdu dont tout revient sur un autre.

**Jamais essayé sur un vrai téléphone.** À faire avant de confier
l'application à un magasin.

## Où on en est

### 1. Serveur et comptes — presque fini

Fait : la base, les comptes, l'équipe, la reprise des données, la
synchronisation, le test à trois téléphones.

Reste à faire :

1. **Régler l'envoi des e-mails de Supabase** (à faire par le propriétaire du
   compte, voir plus bas). Sans ça, un nouveau compte ne peut pas se
   connecter.
2. **Essayer sur deux vrais téléphones**, en boutique, avec une vraie journée
   de ventes.
3. **Enregistrement côté serveur** : faire vérifier par le serveur les
   plafonds d'argent et le stock, et remplir les 21 tables de la fondation.
   Aujourd'hui, ces règles tournent dans le téléphone.

Résultat atteint : le patron et le vendeur se connectent sur leurs téléphones
et voient le même magasin ; perdre un téléphone ne fait rien perdre.

### Réglage Supabase à faire

Dans le tableau de bord Supabase, projet `daftar`, rubrique Authentication :

- **URL du site** : `https://khaliddinarcg-oss.github.io/DAFTAR/`, pour que le
  lien de confirmation reçu par e-mail ramène dans l'application.
- **Ou** désactiver « Confirm email » pendant la validation terrain : le compte
  marche tout de suite, sans e-mail.

L'offre gratuite n'envoie que quelques e-mails par heure : la seconde option
est la plus simple pour des démonstrations.

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
