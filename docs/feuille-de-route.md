# Feuille de route

Où on en est, d'où on vient, où on va. Mise à jour à chaque étape terminée.

```
 FAIT                          EN COURS              À VENIR
 ─────────────────────────────┬─────────────────────┬──────────────────────────────────────
 Application de démonstration │ 1. Serveur et       │ 2. suite : recherche par nom,
 Base de données (fondation)  │    comptes : essai  │    bibliothèque partagée,
 Comptes et synchronisation   │    terrain          │    code-barres
 2A. Article par photo (IA)   │                     │ 3. Devis → vente → facture → avoir
 Fournisseur obligatoire      │                     │ 4. Fiche client
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

### Nouvel article par photo, lu par l'IA — 16 novembre 2026

Stock, « Nouvel article », « Prendre en photo » (ou « Choisir une image ») :

1. L'IA lit la fiche technique, le carton ou la page du catalogue (5 à
   15 secondes) : marque, modèle, référence, type, garantie et les sept
   caractéristiques, aux formats de l'application.
2. La photo du produit est découpée automatiquement dans l'image quand elle y
   figure.
3. Le commerçant vérifie : les champs dont l'IA n'est pas sûre portent
   « à vérifier ». Il ajoute le prix de vente et enregistre. Rien n'entre sans
   lui.
4. La photo de la fiche d'origine est gardée avec l'article (« Fiche lue par
   l'IA le…, vérifiée »).

Fonction serveur `analyser-fiche` (Supabase) : modèle Claude Opus 5.5, effort
faible, réponse structurée. Environ 0,2 DH par fiche, mesuré. Plafond de
60 analyses par magasin et par jour. Clé de l'IA dans les secrets Supabase,
jamais dans l'application. Réservé aux comptes en ligne.

Vérifié par `test/fiche.js` contre la vraie IA et la vraie base : 18 contrôles.

### Réception par photo du bon d'achat — 16 novembre 2026

Stock, « Réception », « Prendre en photo » : l'IA lit le bon d'achat ou la
facture du fournisseur et en fait un résumé (fournisseur, date, numéro,
paiement, lignes, garantie du fournisseur). Pour chaque ligne,
« Réceptionner » :

1. crée le fournisseur s'il est inconnu, pré-rempli d'après le bon ;
2. ouvre la fiche du nouvel article si le modèle n'existe pas (le prix de
   vente reste au commerçant) ;
3. ouvre la réception déjà remplie : quantité, prix d'achat, payé ou à payer,
   date du bon.

Le numéro du bon et la garantie du fournisseur restent sur la réception. Un
bon relu ne se reçoit pas deux fois. Les coordonnées du client inscrites sur
le bon n'ont aucune case dans la réponse de l'IA : elles ne sont jamais
enregistrées. Environ 0,4 DH par bon.

Vérifié par `test/bon.js` sur un vrai bon Electro Bike (coordonnées du client
masquées) : 17 contrôles.

Aussi : une couverture de catalogue sans marque (« F1 Electric Scooter »)
n'est plus rejetée : la fiche s'ouvre avec le modèle et la photo, et conseille
de photographier la page « Specifications ».

### Clôtures, caisse et tableau de bord — 16 novembre 2026

- **Clôture automatique** de chaque journée à minuit ; la journée passée est
  verrouillée.
- **Comptage de la caisse** depuis l'Accueil, à l'aveugle pour le vendeur ;
  le patron voit l'attendu, le compté, l'écart, ce qui a été retiré et ce qui
  a été laissé pour le lendemain.
- **Compta, Clôtures** : la journée en cours, les journées clôturées, les
  semaines et les mois, chacun avec un rapport A4 à imprimer ou à envoyer en
  PDF.
- **Compta, Tableau de bord** (patron) : jour, semaine ou mois ; chiffre
  d'affaires, marge, ventes et panier moyen, trésorerie, comparaison avec la
  période précédente, ventes jour par jour, crédits, livraisons, dettes
  fournisseurs, valeur du stock, meilleures ventes.

Limite : le verrou est appliqué par l'application, pas encore par le
serveur. Un téléphone resté hors ligne plusieurs jours envoie ses ventes à
leur vraie date en revenant, dans une journée déjà clôturée.

### Le fournisseur obligatoire à la réception — 16 novembre 2026

- Un article peut être créé sans fournisseur ; il porte un **fournisseur
  habituel** facultatif, affiché « à renseigner » tant qu'il manque.
- **Rien n'entre en stock sans fournisseur** : la réception le demande, le
  serveur le vérifie.
- Exception : « **Stock déjà en magasin (avant Daftar)** », pour le stock de
  départ, proposé seulement tant que l'article n'a jamais été reçu d'un
  fournisseur. Il n'écrit rien au journal : cet argent a été dépensé avant.

Au passage, un défaut ancien a été trouvé et corrigé : les formulaires de
réception rangeaient le fournisseur à la place de la date, et ignoraient
« À payer plus tard ». Les réceptions abîmées sont réparées au chargement :
le fournisseur est remis à sa place, la date, perdue, devient celle du jour
de la réparation et s'affiche « date inconnue ».

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

### 2. La bibliothèque produits — suite

Fait : l'article par photo (étape A). Reste, dans l'ordre :

- **B. Recherche par nom** : taper « Kukirin G2 Master », l'IA cherche la
  fiche chez le fabricant. Moins fiable que la photo : la source est affichée
  et la vérification reste obligatoire.
- **C. Bibliothèque partagée** : brancher la table `catalogue`. Une fiche
  validée par un magasin sert à tous ; chercher dans la bibliothèque avant
  d'appeler l'IA.
- **D. Code-barres** du carton.
- **Compléter la fiche** : remplir les cases vides d'un article existant, dans
  l'ordre autre photo, bibliothèque, recherche web, déduction ; on ne remplit
  que les cases vides, le commerçant choisit case par case, chaque valeur
  garde sa source. Plus l'énergie de la batterie, calculée (V × Ah). Reporté
  à plus tard, à la demande du 16 novembre.
- **E. Plusieurs photos pour un article** : couverture et page des
  caractéristiques lues ensemble.

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
