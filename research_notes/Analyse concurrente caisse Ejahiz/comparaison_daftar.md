# Analyse concurrente : Ejahiz Caisse face à Daftar, et le marché marocain des caisses

Recherche faite le 17 novembre 2026. **Limite importante** : les sites `caisse.ejahiz.ma`, `ejahiz.ma`, `caissejahiz.ma`, `sagatec.ma` et `systememaroc.com` n'ont pas pu être ouverts directement (le réseau de la session ne les résout pas). Tout ce qui suit vient d'extraits de moteur de recherche, pas d'une lecture complète des pages. Les prix sont ceux annoncés par les éditeurs eux-mêmes, donc commerciaux et à revérifier. Pour finir l'étude, il faut autoriser ces domaines dans les réglages réseau de la session et refaire les lectures.

## 1. Que propose Ejahiz Caisse, et comment se compare-t-elle à Daftar fonction par fonction ?

### Takeaway
Ejahiz Caisse se présente comme une caisse généraliste (encaissement, plusieurs moyens de paiement, stock, rapports du jour, accès à distance, essai gratuit), vendue par une agence numérique qui fait aussi de l'intégration Odoo et du matériel. Rien de ce qui a été trouvé n'indique un suivi par numéro de série, un crédit client ou des tranches, une saisie par photo avec IA, des messages WhatsApp en darija, ni une offre pour les deux-roues. Aucun prix n'a été trouvé.

### Cited Findings
- Le site produit, titré « Ejahiz Caisse », décrit un système de point de vente pour gérer les ventes en magasin, avec plusieurs moyens de paiement, la gestion du stock et des rapports quotidiens, un essai gratuit et un accès à distance (d'après l'extrait de recherche, page non lue en entier) — [caisse.ejahiz.ma](https://caisse.ejahiz.ma/)
- Ejahiz se présente comme une agence numérique de Casablanca : logiciels sur mesure, intégration de l'ERP Odoo, IA et données, du cloud jusqu'au matériel sur place, terminaux de caisse compris (extrait) — [ejahiz.ma](https://ejahiz.ma/)
- Une agence « eJahiz Agence Marketing Digital » recrute un développeur front-end à Agadir — [LinkedIn](https://www.linkedin.com/jobs/view/3502674618) ; un profil freelance eJahiz annonce plus de trois ans en e-commerce (PrestaShop, WooCommerce, Magento), SEO et réseaux sociaux, sous le domaine ejahiz.com — [Codeur.com](https://www.codeur.com/-ejahiz) ; Instagram « eJahiz Digital Agency » — [Instagram](https://www.instagram.com/ejahiz/)
- Des mentions légales d'un site tiers citent « EJAHIZ SARL AU » à Inezgane, sans doute comme réalisateur du site (non vérifié) — [mstraltransport.com](https://mstraltransport.com/mentions-legales/)
- **Risque de confusion** : un autre éditeur, CAISSEJAHIZ (`caissejahiz.ma`), se dit « Numéro 1 des caisses enregistreuses POS et gestion de stock au Maroc » et met en avant stock, ventes, employés, rapports, paiements, avec une synchronisation en temps réel entre PC, tablette et téléphone. Aucun lien avec Ejahiz n'est établi — [caissejahiz.ma](https://caissejahiz.ma/caisse-enregistreuse-pos-maroc/)

### Tableau comparatif (Ejahiz d'après extraits seulement ; « ? » = non trouvé, pas forcément absent)

| Fonction | Daftar | Ejahiz Caisse |
| --- | --- | --- |
| Encaissement, plusieurs moyens de paiement | Oui | Oui (annoncé) |
| Stock | Oui, comptage + véhicules un par un | Oui (annoncé) |
| Rapports du jour / tableau de bord | Journal, analyse | Oui (rapports quotidiens annoncés) |
| Accès à distance / multi-appareil | Synchro Supabase toutes les 20 s | Oui (accès à distance annoncé) |
| Hors connexion | Oui (PWA, tout dans le téléphone) | ? |
| Numéro de série par véhicule | Oui | ? (rien trouvé) |
| Crédit client (kridi), tranches, plafonds | Oui | ? |
| Crédit fournisseur, achat à crédit hors journal | Oui | ? |
| Retour → avoir, numérotation de factures continue, mentions CGI art. 145 | Oui | ? |
| Rôles patron / vendeur (marge cachée) | Oui | ? (CAISSEJAHIZ cite « employés ») |
| Fiche produit et bon d'achat lus par IA depuis une photo | Oui | ? (l'agence vend de « l'IA », pas de preuve dans la caisse) |
| Messages WhatsApp en darija | Oui | ? |
| Interface FR + AR, caisse visuelle par photos | Oui | ? |
| Matériel (terminal, imprimante) | Non, le téléphone suffit | Oui, l'agence vend du matériel de caisse |
| Intégration ERP (Odoo) | Non | Oui, cœur de métier de l'agence |
| Verticale deux-roues / e-mobilité | Oui | Non, généraliste |
| Essai gratuit | Démo Tanja Trott | Oui (annoncé) |
| Prix | Visé 100–200 DH/mois, non validé | Non trouvé |

### Inferences
- Ejahiz paraît être une offre d'agence (logiciel + matériel + intégration Odoo) plutôt qu'un produit de masse en libre-service ; elle vise probablement les commerces qui veulent un poste fixe installé.
- Les différenciateurs de Daftar (série, kridi, IA photo, darija, verticale) ne sont pas contredits par ce qui a été trouvé, mais leur absence chez Ejahiz n'est **pas prouvée** : il faut lire le site en entier.

### Gaps
- Prix, formules, hors connexion, langues, crédit client, numéros de série d'Ejahiz : pages non lues (domaine bloqué).
- Lien éventuel entre Ejahiz (ejahiz.ma) et CAISSEJAHIZ (caissejahiz.ma) : non établi.
- Ville réelle de l'entreprise : Casablanca (site), Agadir (LinkedIn), Inezgane (mentions légales tierces) ; à clarifier.
- Aucun article de presse marocaine (Médias24, LesEco, TelQuel, Le360) sur Ejahiz trouvé ; pas de fiche Play Store trouvée.

## 2. Quels sont les autres concurrents marocains, et combien coûtent-ils (DH/mois) ?

### Takeaway
Les caisses en ligne marocaines pour petits commerces s'affichent entre environ 150 et 400 DH par mois pour l'entrée de gamme, avec des formules hautes jusqu'à 750 DH, ou une licence à vie de 1 290 à 2 500 DH. Loyverse a une base gratuite. Odoo coûte des dizaines de milliers de dirhams d'intégration. Deux applications marocaines, Cridi et Lehri Pro, combinent déjà caisse, crédit client et relances WhatsApp : ce sont les concurrents les plus proches de l'argument « kridi » de Daftar.

### Cited Findings
**Caisses généralistes marocaines (prix annoncés par les éditeurs, extraits de recherche)**
- Sagatec (MaCaisse, « depuis 2013 ») : abonnement dès 150 DH/mois ou licence à vie dès 2 500 DH ; matériel de 4 500 à 12 800 DH par poste ; leur comparatif dit que la licence devient plus avantageuse après environ 17 mois — [sagatec.ma](https://www.sagatec.ma/logiciel-de-caisse/), [comparatif Sagatec](https://www.sagatec.ma/alternative-logiciel-caisse-maroc/), [MaCaisse](https://www.sagatec.ma/macaisse-logiciel-caisse/)
- QuickCom : dès 199 DH/mois, formules 199 / 299 / 399 DH, 14 jours d'essai sans carte — [quickcom.ma](https://quickcom.ma/caisse-enregistreuse-maroc.html), [retail](https://quickcom.ma/activites/retail.html)
- Systeme Maroc : Démarrage 250 DH/mois, Professionnel 329 DH/mois (avec « Robot WhatsApp »), Premium 750 DH/mois — [systememaroc.com](https://systememaroc.com/)
- Caisse212 : 199 DH/mois, 399 DH/mois avec tableau de bord avancé — [caisse212.com](https://caisse212.com/)
- UsePosio (hors ligne) : licence perpétuelle 1 290 DH par caisse, sans abonnement — [useposio.com](https://useposio.com/)
- Autres éditeurs marocains repérés, prix non relevés : Devinstock (paiements multiples, stock, rapports) — [devinstock.com](https://devinstock.com/logiciel-caisse/) ; Yancommerce — [yancommerce.com](https://yancommerce.com/logiciel-caisse-maroc) ; CAISSEJAHIZ — [caissejahiz.ma](https://caissejahiz.ma/)

**Crédit client et WhatsApp (les plus proches de Daftar sur le kridi)**
- Cridi : caisse, crédits clients, stock et gestion du personnel pour commerces de proximité marocains, fonctionne hors ligne ; relances de paiement WhatsApp seulement dans la formule complète. Prix non trouvé — [cridi.ma](https://www.cridi.ma/)
- Lehri Pro : application pour hanouts (stock, factures, crédit), annoncée en darija, avec relances automatiques par WhatsApp. Prix non trouvé — [lehri.pro](https://www.lehri.pro/)
- Kridi (Play Store) : carnet de dettes en arabe, français et anglais, hors ligne, rappel WhatsApp ; pas une caisse — [Google Play](https://play.google.com/store/apps/details?id=com.exynos.kridi&hl=en_US)

**Internationaux et ERP**
- Loyverse : caisse de base gratuite (multi-magasin, analyses, stock, fidélité) ; options « Employee management » et « Advanced inventory » à 25 $/mois par magasin d'après la page officielle, mais des sources tierces et le llms.txt de Loyverse citent 5 €/mois par employé. Pas de prix en dirhams — [loyverse.com/pricing](https://loyverse.com/en-us/pricing), [loyverse llms.txt](https://loyverse.com/llms.txt), [TechnologyAdvice](https://technologyadvice.com/products/loyverse-pos-reviews/)
- Odoo Point de Vente au Maroc : logiciel Community gratuit, mais intégration dès 20 000 MAD (Nelozia, Pack Start) ou 25 000 DH HT (agence casablancaise) ; 15 000 à 40 000 DH pour une micro-entreprise selon un autre guide. Les sources se contredisent sur la localisation comptable marocaine en version Community. Gère les terminaux CMI — [Nelozia](https://www.nelozia.com/blog/notre-blog-3/odoo-point-de-vente-pos-au-maroc-guide-complet-2026-caisse-stock-et-comptabilite-83), [agence-ksur](https://www.agence-ksur.com/erp-crm-maroc), [oasistechnocloud](https://oasistechnocloud.com/blog/combien-coute-odoo-maroc/)

### Inferences
- Le tarif visé par Daftar (100–200 DH/mois) se situe au bas de la fourchette des caisses marocaines (150–400 DH), ce qui est cohérent. 199 DH/mois est un prix d'appel fréquent (QuickCom, Caisse212).
- La licence à vie (1 290–2 500 DH) est un contre-argument que les patrons entendront ; Sagatec en fait déjà un argument contre l'abonnement.
- Le crédit client et les relances WhatsApp ne sont plus uniques au Maroc (Cridi, Lehri Pro, Systeme Maroc) : l'argument kridi seul ne suffit pas à différencier Daftar.

### Gaps
- SumUp, Square et équivalents : aucune présence au Maroc trouvée dans cette recherche ; le paiement par carte passe surtout par les terminaux CMI (non vérifié au-delà de la mention Odoo).
- Prix de Cridi, Lehri Pro, Devinstock, CAISSEJAHIZ : non trouvés.
- Aucun chiffre de part de marché ni article de presse marocaine sur ce marché trouvé.

## 3. Existe-t-il des caisses spécialisées pour les vendeurs de véhicules ou de deux-roues au Maroc ?

### Takeaway
Aucune trouvée. Les logiciels de concession moto, scooter et vélo qui suivent chaque machine par numéro de série ou de cadre sont français (Epsylon, BikeSoft, G8, MotoClic, logicielmoto.com) et ne visent pas le Maroc d'après ce qui a été trouvé. Le seul résultat marocain proche gère des flottes automobiles, pas une boutique.

### Cited Findings
- Epsylon : client et véhicule identifiés par numéro de série ou de cadre, caisse et facturation, du mécanicien indépendant à la concession — [epsylon-cie.fr](https://epsylon-cie.fr/logiciel-atelier-moto)
- logicielmoto.com : chaque machine suivie par son numéro de série de l'achat à la vente, avec l'historique des interventions — [logicielmoto.com](https://logicielmoto.com/)
- BikeSoft : concession moto, quad, scooter, vélo, avec fiches techniques et caisse — [proxy-informatique.com](https://proxy-informatique.com/bikesoft/)
- MotoClic (garages et concessions, VIN) — [motoclic.pro](https://www.motoclic.pro/) ; G8 d'Orisha (magasins, concessions, ateliers moto) — [orisha.com](https://retail-shops.orisha.com/logiciel-magasin-concession-moto/)
- Planetsoft (Maroc) : gestion de parc auto (immatriculation, carte grise, numéro de châssis), destinée aux flottes — [planetsoft.ma](https://www.planetsoft.ma/logiciel-de-gestion-de-parc-auto/)

### Inferences
- Le créneau « caisse pour boutique de deux-roues électriques au Maroc » paraît libre. Les logiciels français montrent ce que le métier attend ensuite : un **historique d'atelier par machine** (réparations, garantie). Daftar a déjà le numéro de série, qui en est la base.

### Gaps
- Pas de recherche sur Play Store ni sur Facebook pour des applications locales de vendeurs de motos ; un outil informel peut exister.

## Leçons pour Daftar (synthèse à partir des sections ci-dessus)

### Takeaway
Ejahiz et les caisses généralistes marocaines gagnent sur le matériel, l'installation et l'intégration ; Daftar gagne sur le métier (véhicule suivi par série, crédit et tranches, IA photo, darija) et sur le prix d'entrée nul en matériel. Le crédit client et WhatsApp seuls ne différencient plus.

### Cited Findings
- Ejahiz vend aussi du matériel de caisse et de l'intégration Odoo — [ejahiz.ma](https://ejahiz.ma/)
- Le crédit client avec relance WhatsApp existe déjà chez Cridi (formule complète) et Lehri Pro (en darija) — [cridi.ma](https://www.cridi.ma/), [lehri.pro](https://www.lehri.pro/)
- Fourchette de prix : 150 DH (Sagatec), 199 DH (QuickCom, Caisse212), 250–750 DH (Systeme Maroc) ; licences 1 290–2 500 DH — sources en section 2
- Essais gratuits de 14 jours courants (QuickCom) — [quickcom.ma](https://quickcom.ma/caisse-enregistreuse-maroc.html)

### Inferences
- **Ce qu'Ejahiz (et le marché) a et que Daftar n'a pas** : matériel fourni (imprimante ticket, tiroir), installation sur place, rapports « clôture du jour », accès patron à distance présenté comme argument, essai gratuit formel. Daftar n'a jamais testé l'impression sur un vrai téléphone : c'est l'écart le plus visible face à une caisse classique.
- **Différenciateurs à mettre en avant** : (1) chaque trottinette suivie par son numéro de série, avec garantie et certificat de vente ; (2) kridi avec tranches et plafonds, adossé à ce numéro de série ; (3) article et bon d'achat lus depuis une photo ; (4) aucun matériel à acheter, le téléphone suffit, hors connexion ; (5) marge cachée au vendeur.
- **Points d'ancrage de prix** : 199 DH/mois est le prix d'appel du marché ; à 100–150 DH Daftar serait moins cher que tous les abonnements relevés. Préparer une réponse à « Posio coûte 1 290 DH une fois » (par exemple une formule annuelle).
- **Positionnement** : ne pas vendre « une caisse avec crédit » (Cridi, Lehri Pro le font) mais « l'outil du vendeur de trottinettes » ; un historique d'atelier ou SAV par machine serait l'extension naturelle, comme chez les logiciels de concession français, à confirmer d'abord avec un vendeur, selon la règle du projet.

### Gaps
- Sans le site Ejahiz lu en entier, la comparaison fonction par fonction reste provisoire.
- La disposition à payer des vendeurs de Tanger n'est pas mesurée (hypothèse du projet).
