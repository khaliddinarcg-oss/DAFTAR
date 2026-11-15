# Daftar — version 1

Gestion de magasin de trottinettes : ventes au QR, stock, crédit client, fournisseurs,
factures, garantie et comptabilité. Tout tient dans une page web autonome.

---

## 1. Ce que contient le dossier

| Fichier | Rôle |
| --- | --- |
| `index.html` | L'application entière : écrans, règles, données. Rien d'autre n'est nécessaire pour la faire tourner. |
| `manifest.webmanifest` | Ce qui permet de l'installer sur l'écran d'accueil comme une vraie application. |
| `sw.js` | Le service worker : après la première ouverture, l'application fonctionne sans connexion. |
| `img/icon-192.png`, `img/icon-512.png` | Les icônes de l'application. |

Trois bibliothèques sont chargées depuis internet à la première ouverture, puis gardées
en cache : lecture des QR (jsQR), fabrication des QR (qrcode-generator), export Excel (SheetJS),
capture d'écran et PDF (html2canvas, jsPDF).

---

## 2. La mettre en ligne (30 minutes)

L'application a besoin d'une adresse en **https** : la caméra, l'installation sur l'écran
d'accueil et le mode hors connexion ne fonctionnent pas autrement.

**Le plus simple, gratuit :**

1. Créez un compte sur Netlify, Vercel ou Cloudflare Pages.
2. Glissez le dossier `daftar-v1` dans la zone de dépôt.
3. Vous obtenez une adresse du type `https://daftar.netlify.app`.
4. Achetez un domaine si vous voulez (`daftar.ma`, environ 100 DH par an) et branchez-le.

**Avec un hébergement marocain classique** (OVH, Genious, HostMaroc) : envoyez les fichiers
par FTP dans le dossier public, et vérifiez que le certificat https est actif.

**Dernière étape, importante :** ouvrez l'application, allez dans
Réglages → Informations de facturation → « Adresse de l'application », et mettez votre
adresse https. Les QR codes imprimés pointeront alors vers votre site, et l'appareil photo
du téléphone ouvrira directement la bonne fiche.

---

## 3. L'installer sur le téléphone du vendeur

1. Ouvrir l'adresse dans Chrome (Android) ou Safari (iPhone).
2. Android : menu `⋮` → « Installer l'application ». iPhone : Partager → « Sur l'écran d'accueil ».
3. L'icône apparaît comme une application normale, en plein écran, sans barre de navigateur.

Une fois installée, elle gagne ce qui manquait dans la démonstration :

- la **caméra en direct** pour scanner, sans prendre de photo ;
- l'**impression** directe depuis le menu du téléphone ;
- le **fonctionnement sans connexion**.

---

## 4. En faire un APK Android

Le fichier APK n'apporte rien de plus techniquement, mais il rassure les commerçants et
permet de passer par le Play Store. Deux chemins :

**PWABuilder (sans code, 15 minutes)**
1. Allez sur `pwabuilder.com`, entrez l'adresse de votre site.
2. Cliquez « Package for stores » → Android.
3. Vous récupérez un `.apk` à installer directement et un `.aab` pour le Play Store.

**Bubblewrap (en ligne de commande)**
```
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://votre-domaine/manifest.webmanifest
bubblewrap build
```

Dans les deux cas, publier sur le Play Store demande un compte développeur Google
(25 USD une fois) et une politique de confidentialité en ligne.

Pour iPhone, l'App Store n'accepte pas une simple page web : il faudrait passer par
Capacitor (`npm i @capacitor/core @capacitor/cli`, `npx cap add ios`). L'installation sur
l'écran d'accueil suffit dans la plupart des cas.

---

## 5. La limite à connaître, et la suite

**Les données vivent dans le téléphone**, dans le stockage du navigateur. Conséquences :

- vider les données du navigateur efface le magasin ;
- deux téléphones ne voient pas le même stock ;
- rien n'est sauvegardé ailleurs.

C'est tenable pour un magasin, un téléphone, et une démonstration. Ce n'est pas tenable
pour une vraie exploitation. L'ordre des chantiers, pour le développeur :

1. **Serveur et comptes.** Une base de données, une sauvegarde, un compte par personne,
   et les mêmes règles vérifiées côté serveur. C'est ce qui débloque tout le reste.
2. **La fiche client.** Aujourd'hui le nom est recopié sur chaque vente : il n'y a pas
   d'historique par client.
3. **L'impression thermique.** Imprimante Bluetooth, rouleaux 58 et 80 mm, pour les tickets
   et les étiquettes.
4. **Les rappels automatiques** par WhatsApp Business API, au lieu du message préparé à la main.
5. **Le multi-magasin** et les transferts de stock.

En attendant le point 1, dites au commerçant d'utiliser chaque semaine
Compta → Journal → « Exporter en Excel » : c'est sa sauvegarde.

---

## 6. Pour le développeur qui reprend le code

- Tout est dans `index.html` : styles, logique, interface, sans étape de compilation.
- La logique métier (ventes, stock, crédit, achats, factures, journal) est écrite en
  fonctions pures au début du script, avant le bloc `if (typeof document !== 'undefined')`.
  Elle est testable telle quelle sous Node et devra être rejouée côté serveur.
- L'état complet du magasin est un seul objet `S`, sauvegardé en JSON sous la clé
  `daftar-v3` du `localStorage`. C'est le point de départ de la migration vers une base.
- Les règles et limites sont rassemblées dans les constantes `R` et `RULES` et dans les
  fonctions de vérification passées aux formulaires.
- Les QR portent soit une adresse `https://…#qr-<identifiant>`, soit un texte
  `DAFTAR:<type>:<identifiant>|<nom>`. La fonction `resolveCode` accepte les deux et
  retrouve aussi un article par sa référence, son nom ou son numéro de série.
