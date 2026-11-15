# Daftar — gestion de magasin de trottinettes

Application de caisse et de gestion pour les magasins de trottinettes électriques
au Maroc, à Tanger d'abord. Interface en français, messages clients en darija.
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

## Ce qui reste à construire, dans l'ordre

1. Serveur et comptes : les données vivent aujourd'hui dans un seul téléphone.
2. Fiche client : le nom est recopié sur chaque vente, il n'y a pas d'historique.
3. Impression thermique Bluetooth, rouleaux 58 et 80 mm.
4. Rappels automatiques par WhatsApp Business API.
5. Multi-magasin et transferts de stock.

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
| `docs/feuille-de-route.md` | Ce qui reste à construire, dans l'ordre |
| `tools/etiquettes.py` | Génère une feuille d'étiquettes QR à imprimer |

## Comment travailler sur ce projet

- Le produit est en validation terrain. Avant d'ajouter une fonction, demander
  si un vendeur l'a réclamée : la liste de ce qui manque est déjà longue et
  l'ordre compte plus que la quantité.
- Ne pas casser les règles de `docs/regles.md` sans le dire.
- Lancer `node test/smoke.js` avant chaque publication. Un push sur `main`
  republie le site en une à deux minutes.
- Écrire en français, dans l'interface comme dans les commits. Les messages
  envoyés aux clients sont en darija, en lettres latines.
