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
