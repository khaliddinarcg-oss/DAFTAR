# Journal des décisions

Ce qui a été tranché, et pourquoi. À lire avant de rouvrir un de ces sujets.

| Décision | Raison |
| --- | --- |
| Outil de gestion plutôt que place de marché | Utile dès le premier magasin ; Avito tient déjà la place de marché |
| Une seule page web autonome, sans serveur | Montrable en boutique sans rien installer ; la limite est dite au commerçant |
| Thème sombre unique, inspiré des trottinettes | Noir anodisé, un seul accent rouge feu, écran de guidon pour les chiffres, cellules de batterie pour les jauges, boutons à coins coupés |
| L'application porte le nom du magasin | Marque blanche : aucun nom de logiciel dans l'interface |
| Saisie par listes, jamais par frappe libre | La qualité des données en dépend ; chaque liste finit par « + Nouveau… » |
| Fiche d'identité par article et par fournisseur | Marque, modèle, référence, caractéristiques, photo, garantie d'un côté ; nom, ville, téléphone, note de l'autre |
| Un QR par article, pas par unité | C'est l'objet que le vendeur colle et scanne ; l'unité vendue est choisie automatiquement |
| Le QR contient un lien, pas les données | Le stock et le fournisseur changent ; une étiquette figée mentirait. L'appareil photo du téléphone ouvre l'application sur la bonne fiche |
| Panier multi-articles | Une vente peut porter plusieurs lignes, un seul ticket, une seule facture |
| Facture professionnelle A4 | En-tête, tableau, totaux, montant en toutes lettres, mentions marocaines, logo et couleur réglables |
| Un achat à crédit n'écrit rien au journal | La sortie d'argent s'inscrit le jour du paiement, pour que le solde du mois soit juste |
| Deux rôles plutôt qu'un | Le patron ne confie pas ses marges ; le vendeur garde ce qu'il lui faut pour vendre |
| Données d'exemple courtes | Cinq articles, deux fournisseurs, six ventes : un vendeur doit suivre du regard pendant la démonstration |
| Export Excel à cinq feuilles | Journal, ventes, factures, crédits, stock. CSV en plus pour l'import dans un logiciel comptable |
| Supabase, offre gratuite, région Paris (15 nov. 2026) | Base, comptes et stockage des photos prêts à l'emploi, sans serveur à administrer ; gratuit tant que l'on montre le produit, environ 250 DH par mois ensuite. Paris est la région proposée la plus proche de Tanger |
| Catalogue partagé, séparé du stock du magasin | Une fiche produit correcte n'est saisie qu'une fois et sert à tous les magasins ; chaque magasin garde son prix, son stock, ses numéros de série |
| Prix d'achat dans des tables à part | Le vendeur ne les reçoit jamais du serveur : la séparation des rôles devient une vraie sécurité, plus seulement un affichage |
| Numéros de ticket, facture et avoir donnés par le serveur | Deux téléphones du même magasin ne peuvent ni doubler un numéro ni laisser un trou |
| Trois rôles : patron, vendeur, comptable | Le comptable lit tout, y compris les coûts, et n'écrit rien |
| L'OCR par IA plutôt que l'OCR gratuit du téléphone | L'OCR gratuit lit du texte brut ; l'IA remplit les champs de la fiche. Moins d'un centime de dirham par fiche ; demande le serveur pour garder la clé |
| Synchronisation par éléments, pas encore par tables (16 nov. 2026) | L'application modifie ses données à des dizaines d'endroits ; envoyer chaque élément de `S` qui a changé ne touche ni la logique métier ni les écrans. Les 21 tables restent la cible de l'enregistrement côté serveur |
| Sans compte, l'application marche comme avant | Les démonstrations en boutique se font sans inscription ; le compte s'ajoute quand le commerçant veut garder ses données |
| Le coût d'une vente du vendeur est calculé chez le patron | Le téléphone du vendeur ne connaît pas les prix d'achat et ne doit pas les connaître |
| Le vendeur est ajouté par son adresse e-mail, après avoir créé son compte | Pas d'e-mail d'invitation à envoyer : l'offre gratuite de Supabase en envoie très peu |
| Fournisseur facultatif à la création de l'article, obligatoire à la réception (16 nov. 2026) | La fiche décrit le produit et sera partagée ; le fournisseur compte dès que de l'argent et du stock sont en jeu (dette, relevé, retour, garantie). Le stock de départ a son propre choix, sinon un commerçant ne pourrait jamais saisir ce qu'il a déjà |
| Article par photo de la fiche avant la recherche par nom | L'IA lit ce qui est écrit au lieu de deviner ; le commerçant vérifie toujours. Opus 5.5 en effort faible : environ 0,2 DH la fiche, mesuré |
| La lecture par IA passe par une fonction du serveur | La clé de l'IA ne doit jamais être dans l'application ; le serveur vérifie aussi l'appartenance au magasin et plafonne à 60 analyses par jour |
| Garantie choisie dans une liste fermée, jamais tapée (16 nov. 2026) | Moins d'erreurs de saisie. La liste couvre de 1 à 36 mois : une garantie d'un mois (bon Electro Bike) devenait 12 mois en silence avec l'ancienne liste |
| Trottinettes, vélos, scooters et motos électriques (16 nov. 2026) | Le même commerçant vend souvent les quatre. Tout ce qui n'est pas une pièce est un véhicule, suivi par numéro de série ; aucune logique ne dépend du type de véhicule |
| Facture sur le modèle du bon d'un revendeur de Tanger (Electro Bike) | C'est ce que les clients connaissent : en-tête au logo, cadre client, tableau quadrillé, total surligné, pied de page aux coordonnées. Les mentions légales marocaines qu'il n'avait pas sont gardées : ICE, IF, RC, patente, montant en lettres, TVA |
| Facture A4 professionnelle (17 nov. 2026), remplace le modèle Electro Bike | Demandé par le patron : « quelque chose de pro ». En-tête à deux colonnes (magasin à gauche, FACTURE et ses références à droite), cadres Émetteur avec ICE, IF, RC, patente, et Client ; tableau numéroté sans lignes vides ; somme en lettres ; encadré des totaux HT, TVA, TTC ; garantie, RIB, cachet ; mentions légales en pied de page. Sur le téléphone, la page A4 entière s'affiche en réduction, comme elle sortira |
| Une facture garde la TVA de son émission | Changer le taux dans les réglages ne modifie jamais une facture déjà faite |
| Clôture automatique de chaque journée à minuit (16 nov. 2026) | Demandé par le patron : personne n'oublie de clôturer. Le verrou se déduit de la date du jour, rien à stocker |
| Comptage de caisse à l'aveugle pour le vendeur | Il tape ce qu'il compte sans voir ce qui est attendu : l'écart dit la vérité |
| La caisse attendue part du dernier comptage | Personne ne connaît le contenu du tiroir avant le premier comptage ; additionner tout l'historique donnait −12 650 DH dans le magasin d'exemple |
| Le tableau de bord compare à la période précédente coupée à la même durée | Un mois en cours n'est pas comparé à un mois entier |
| Caisse visuelle, comme dans un restaurant (17 nov. 2026) | Beaucoup de vendeurs lisent mal le français. Une couleur et une icône par catégorie, une photo par article, un toucher pour ajouter, le panier toujours en bas. L'écran des catégories compte 10 mots, l'ancien écran de vente 114 |
| Français et arabe ensemble sur la caisse | Demandé par le patron. Les mots arabes (تروتينيت، بيكالة، موطور، كريدي، خلّص…) sont à faire valider par des commerçants |
| Accessoires séparés des pièces détachées | Casque, antivol, chargeur d'un côté ; chambre à air, frein, pneu de l'autre. Les véhicules sont listés explicitement (`VEH`) au lieu de « tout ce qui n'est pas une pièce » |
| Style « registre », sobre et lisible (17 nov. 2026) | Avis d'un designer : l'ancien style (fond noir, italique, majuscules, coins coupés, lumières) faisait jeu vidéo, pas outil de gestion. Trois propositions montrées ; le patron a choisi « registre » : fond crème, bandeau bleu nuit, cartes blanches, titres à empattements, police du téléphone (plus de police téléchargée). La couleur ne sert qu'à signaler : vert = argent reçu, rouge = retard, ambre = à surveiller ; les boutons d'action sont bleu nuit. Grandes cases dans la caisse, et rien de touchable sous 44 pixels, boutons de 48, champs de 50, barre du bas avec icônes |

## Erreurs commises, pour ne pas les refaire

- **Un remaniement a supprimé `resolveCode`** sans que rien ne le signale :
  l'application lisait le QR puis mourait en silence dans la boucle de la
  caméra. Perdu une demi-journée. D'où `test/smoke.js`, qui charge la page dans
  un vrai navigateur et vérifie les quatre cas de scan et les quinze écrans.
  **À lancer avant chaque publication.**
- **Des étiquettes imprimées depuis une autre installation** ne correspondent à
  rien : les QR portent l'adresse du site qui les a produits. Réimprimer après
  chaque changement d'adresse.
- **Un format de QR trop court** n'était pas lu de façon fiable. Les étiquettes
  portent maintenant le nom et la référence en plus de l'identifiant.
- **Le service worker gardait en cache toutes les réponses venant d'autres
  sites**, ce qui aurait figé les données du serveur : chaque téléphone aurait
  relu d'anciennes données. Les adresses `*.supabase.co` passent maintenant
  toujours par le réseau.
- **Tout formulaire validé faisait sortir du mode démonstration**, y compris
  la connexion. Les formulaires du compte ne touchent plus à ce marqueur.
- **La renumérotation d'un ticket en double cherchait le ticket par son
  numéro**, donc renommait aussi celui de l'autre téléphone : les deux se
  couraient après. Elle cherche maintenant par identifiant. Trouvé par
  `test/sync.js`, qui simule une vente hors ligne.
- **Un vendeur ne peut pas « écraser » une ligne qu'il n'a pas le droit de
  lire**, même neuve : la base refuse l'envoi avec remplacement. Il fait un
  envoi simple, et un doublon compte comme déjà reçu.
- **Les formulaires de réception appelaient `receive()` sans la date**, depuis
  le début : l'identifiant du fournisseur était rangé dans la date, le
  fournisseur restait vide, « À payer plus tard » était ignoré, et ces achats
  disparaissaient du journal du mois. Invisible avec les données d'exemple,
  qui passent par un autre chemin. Trouvé par `test/fiche.js`. Corrigé, et
  `repairReceptions` répare les données déjà enregistrées.
- **Une ligne refusée par le serveur et jamais envoyée était effacée du
  téléphone.** Elle reste maintenant sur le téléphone, avec le message de
  refus dans Réglages.
- **Les ventes du magasin d'exemple pointaient vers des trottinettes qui
  n'existaient plus** : à sa création, Tanja Trott renommait ses trottinettes
  sans mettre à jour les lignes de tickets. Un retour sur une vente d'exemple
  laissait la trottinette « vendue ». Trouvé par `test/logique.js`. Corrigé, et
  `relinkUnits` répare les téléphones qui ont déjà ces exemples.
- **La mémoire du téléphone pleine faisait perdre des données sans rien
  dire.** Elle est limitée à environ 5 Mo, et les photos d'articles y sont
  rangées. Un message prévient maintenant. Ranger les photos dans le stockage
  Supabase reste à faire.
- **Un premier verrou serveur bloquait tout envoi** : la fonction qu'il
  appelait n'était pas autorisée pour les comptes connectés. Trouvé par un
  essai direct avant publication. Tout nouveau verrou s'essaie en compte
  patron et en compte vendeur, en cas accepté et en cas refusé.
- **Le PDF d'une facture était une photo de l'écran du téléphone** : une
  bande étroite au milieu d'une page A4. La page est maintenant redessinée
  hors écran à la largeur d'une vraie page A4 (794 pixels), et continue sur
  une seconde page si elle est trop longue. « Envoyer le PDF » ouvre le
  partage du téléphone (WhatsApp) au lieu de télécharger le fichier.
