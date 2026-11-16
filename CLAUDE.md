# Daftar — gestion de magasin de trottinettes

Application de caisse et de gestion pour les magasins de trottinettes, vélos,
scooters et motos électriques au Maroc, à Tanger d'abord. Types d'articles dans
`KINDS` : t trottinette, v vélo, s scooter, m moto (des véhicules, `VEH`, suivis
un par un avec leur numéro de série), p pièce détachée et a accessoire (comptés).
L'écran de vente est une caisse visuelle (catégories, grille de photos, panier en
bas), libellés en français et en arabe : peu de mots, des icônes et des couleurs. Interface en français, messages clients en darija.
Le produit est en phase de validation terrain : il est montré aux commerçants
pour savoir ce qu'ils paieraient, pas encore vendu.

## Ce que c'est, techniquement

Une page web autonome. Tout est dans `index.html` : styles, logique métier,
interface. Pas d'étape de compilation, pas de dépendances à installer.

| Fichier | Rôle |
| --- | --- |
| `index.html` | L'application entière |
| `manifest.webmanifest`, `sw.js`, `img/` | Installation sur l'écran d'accueil et fonctionnement hors connexion |
| `test/smoke.js` | Test de bout en bout dans un vrai navigateur |
| `test/sync.js` | Test de la synchronisation : trois téléphones simulés contre la vraie base |
| `test/fiche.js` | Test de l'article par photo : vraie IA, vraie base (environ 0,2 DH par passage) |
| `test/bon.js` | Test de la réception par photo du bon d'achat : vraie IA, vraie base (environ 0,4 DH) |
| `test/logique.js` | Des milliers d'opérations au hasard sur la logique métier, règles vérifiées après chacune |
| `test/qa.js` | Clique chaque bouton de chaque écran, en patron et en vendeur, et cherche erreurs et incohérences |
| `supabase/migrations/` | Schéma de la base Supabase, une migration par étape |
| `supabase/functions/analyser-fiche/` | Fonction serveur qui lit avec l'IA une fiche produit ou un bon d'achat |
| `README.md` | Mise en ligne, APK, reprise du code |

Hébergé sur GitHub Pages : <https://khaliddinarcg-oss.github.io/DAFTAR/>.
Un push sur `main` republie en une à deux minutes.

## Organisation du code dans index.html

1. **Logique métier**, en premier, en fonctions pures : `sell`, `refund`,
   `exchange`, `payCredit`, `payBuy`, `receive`, `invoice`, `journal`,
   `statement`, `analyse`, `exportTables`, `seed`.
   Elle ne touche pas au DOM et sera rejouée côté serveur le jour venu.
2. **Interface**, dans le bloc `if (typeof document !== 'undefined')` :
   vues, panneaux, actions, scan.

L'état complet du magasin est un objet `S`, enregistré en JSON sous la clé
`daftar-v3` du `localStorage`. C'est le point de départ de la migration vers
une base de données.

## Règles à ne pas casser

- **Les plafonds** : un encaissement ne dépasse jamais le reste dû, une avance
  jamais le prix, une tranche jamais le reste. Les constantes sont dans `R` et
  `RULES` ; chaque formulaire reçoit une fonction de vérification.
- **Les deux rôles** : `isP()` distingue le patron du vendeur. Le vendeur ne voit
  ni prix d'achat, ni marge, ni comptabilité, et ne supprime rien.
- **La numérotation des factures** est continue et sans trou. Une facture ne se
  supprime pas : un retour produit un avoir.
- **Un achat à crédit n'écrit rien au journal** le jour de la réception. La
  sortie d'argent s'inscrit le jour du paiement au fournisseur.
- **Rien n'entre en stock sans fournisseur** : chaque réception en choisit un,
  ou « Stock déjà en magasin » tant que l'article n'a jamais été reçu d'un
  fournisseur (`supErr`). Le serveur le vérifie aussi.
- **`resolveCode`** reconnaît une étiquette par identifiant, référence, nom ou
  numéro de série, et accepte aussi bien `DAFTAR:A:<id>|<nom>` qu'une adresse
  `https://…#qr-<id>`. Elle est appelée par `handleCode` : ne pas la perdre lors
  d'un remaniement, l'application plante en silence sans elle.

## Avant chaque publication

```
node test/smoke.js
```

Charge `index.html` dans Chrome, scanne un article, un fournisseur, un lien et
un code inconnu, puis parcourt les quinze écrans. Nécessite `playwright` et un
Chrome local ; sans eux, le script le dit et sort sans échouer.

Lancer aussi `node test/logique.js` (quelques secondes). `node test/qa.js`
(une vingtaine de minutes) après un changement d'interface.

Si la synchronisation a changé, lancer aussi `test/sync.js` avec les comptes de
test (voir `docs/base-de-donnees.md`), puis supprimer le magasin qu'il crée.

## Ce qui reste à construire, dans l'ordre

Voir `docs/feuille-de-route.md`, tenue à jour. En bref :

1. Serveur et comptes — presque fini : comptes, équipe et synchronisation
   marchent ; reste l'essai sur vrais téléphones et l'enregistrement côté
   serveur.
2. Bibliothèque produits — l'article par photo lu par l'IA est fait ;
   restent la recherche par nom, la bibliothèque partagée, le code-barres.
3. Devis → vente → facture → avoir.
4. Fiche client.
5. Impression thermique, envois WhatsApp, multi-magasin, fournisseurs.

## Conventions

- Français pour l'interface et les commits, darija pour les messages envoyés
  aux clients.
- Les montants sont en dirhams, entiers, affichés par `dh()`.
- Pas de bibliothèque ajoutée sans raison : les cinq actuelles (jsQR,
  qrcode-generator, SheetJS, html2canvas, jsPDF) viennent d'un CDN et sont mises
  en cache par le service worker.

## État au 15 novembre 2026

Ce qui fonctionne et a été vérifié dans un navigateur : le scan d'une étiquette
d'article, d'un fournisseur, d'un lien `#qr-<id>` et d'un code inconnu ; le
panier à plusieurs lignes ; les quinze écrans ; les calculs de vente, crédit,
achat, facture et journal.

Ce qui n'a jamais été vérifié sur un vrai téléphone : l'impression, la création
du fichier Excel, la caméra en direct. À tester sur place.

Base de données Supabase (projet `daftar`, Paris), branchée le 16 novembre
2026. Sans compte, l'application marche comme avant, dans le téléphone. Avec
un compte relié à un magasin, chaque élément de `S` qui change est envoyé à la
table `elements`, et les changements des autres téléphones arrivent toutes les
20 secondes. Le code est à la fin du bloc d'interface (« compte et
synchronisation en ligne »), les fonctions pures `toRows`, `applyRow`,
`fixCounters`, `fillCosts`, `renameTicket` avec la logique métier. Toute
modification du schéma passe par une nouvelle migration dans
`supabase/migrations/`, puis les contrôles de sécurité de Supabase.

Ne jamais mettre en cache les réponses de `*.supabase.co` dans `sw.js`.

Le magasin de démonstration s'appelle Tanja Trott : cinq articles, deux
fournisseurs, six ventes, un retour, une facture. « Remettre les exemples »
dans Réglages le recharge.

## Les documents à lire avant de décider quoi que ce soit

| Fichier | Contenu |
| --- | --- |
| `docs/contexte-produit.md` | Pour qui, ce que la recherche a montré, les choix et leurs raisons |
| `docs/journal-des-decisions.md` | Ce qui est tranché, et les erreurs déjà commises |
| `docs/regles.md` | Toutes les limites appliquées par l'application |
| `docs/parcours-demo.md` | Le script de démonstration en boutique, avec les phrases en darija |
| `docs/feuille-de-route.md` | Ce qui est fait, où on en est, ce qui reste, dans l'ordre |
| `docs/base-de-donnees.md` | La base Supabase : tables, rôles, règles appliquées par le serveur |
| `tools/etiquettes.py` | Génère une feuille d'étiquettes QR à imprimer |
| `tools/acces.py` | Génère le QR et l'affiche A4 qui ouvrent l'application (`docs/acces/`) |

## Comment travailler sur ce projet

- Le produit est en validation terrain. Avant d'ajouter une fonction, demander
  si un vendeur l'a réclamée : la liste de ce qui manque est déjà longue et
  l'ordre compte plus que la quantité.
- Ne pas casser les règles de `docs/regles.md` sans le dire.
- Lancer `node test/smoke.js` avant chaque publication. Un push sur `main`
  republie le site en une à deux minutes.
- Écrire en français, dans l'interface comme dans les commits. Les messages
  envoyés aux clients sont en darija, en lettres latines.
