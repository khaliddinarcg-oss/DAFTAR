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
