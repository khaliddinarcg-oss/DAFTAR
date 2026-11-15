# Ce qui reste à construire

Dans cet ordre. Les trois premiers points séparent une démonstration d'un
produit utilisable pour de vrai.

## 1. Serveur et comptes

Les données vivent dans le `localStorage` d'un seul téléphone. Vider le
navigateur efface le magasin, deux téléphones ne voient pas le même stock, rien
n'est sauvegardé. Il faut une base, une sauvegarde, un compte par personne, et
les mêmes règles vérifiées côté serveur — la logique métier de `index.html` est
écrite en fonctions pures pour être rejouée telle quelle.

Trois rôles à prévoir : patron, vendeur par magasin avec son nom sur chaque
vente, comptable en lecture seule.

## 2. La fiche client

La seule entité qui manque. Aujourd'hui le nom et le téléphone sont recopiés
sur chaque ticket, chaque crédit, chaque envoi. Sans fiche client : pas
d'historique, pas de relance groupée, pas de fidélité.

## 3. L'impression directe

Imprimante thermique Bluetooth, rouleaux 58 et 80 mm, pour les tickets et les
étiquettes QR, sans passer par un PDF. Aujourd'hui l'application produit une
image ou un PDF que le téléphone imprime.

## 4. Les envois automatiques

Les rappels d'échéance partent seuls par WhatsApp Business API, au lieu d'être
déclenchés à la main. La facture s'envoie en pièce jointe sans passer par la
galerie.

## 5. Le multi-magasin

Un patron, plusieurs boutiques, un stock par boutique, des transferts entre
elles.

## 6. Le côté fournisseur complet

Commandes passées avant réception, délais promis, retours au fournisseur d'une
pièce défectueuse, prix d'achat qui varie d'un envoi à l'autre.

## Question à trancher avant le point 1

Application installée ou site web. Une application installée imprime
directement et fonctionne hors connexion ; un site s'ouvre d'un lien, ce qui
vend mieux en démonstration. L'application web installée sur l'écran d'accueil
est le compromis actuel, et elle couvre déjà la caméra en direct, l'impression
et le hors-ligne.
