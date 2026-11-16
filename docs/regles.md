# Les règles appliquées par l'application

Toutes celles-ci sont dans le code. Quand une règle bloque, la fenêtre reste
ouverte et le message dit le maximum autorisé, pour que la personne corrige
sans tout retaper.

## Argent

| Règle | Ce qui est refusé |
| --- | --- |
| Encaissement plafonné | Un montant supérieur au reste dû |
| Montant positif | Un encaissement ou un paiement à 0 ou négatif |
| Avance de crédit | Une avance supérieure au prix de la vente |
| Tranche | Une tranche à 0, ou supérieure au reste à payer |
| Échéance | Une première échéance dans le passé |
| Paiement fournisseur | Plus que ce qui reste dû sur l'achat |
| Prix de vente | 0, ou au-dessus de 500 000 DH |
| Nouvel article | Un prix d'achat supérieur au prix de vente |

## Stock

| Règle | Ce qui est refusé |
| --- | --- |
| Vendre ce qu'on n'a pas | Plus que le stock ; une unité vendue, en atelier ou manquante |
| Numéro de série unique | Un numéro déjà porté, ou deux fois le même dans une réception |
| Série et quantité | Plus de numéros que d'unités reçues |
| Taille d'une réception | Plus de 50 unités d'un coup |
| Article en double | Même marque, même modèle, même type |
| Date de réception | Une date dans le futur |
| Bon d'achat relu | Réceptionner deux fois la même ligne d'un même bon |
| Réception sans fournisseur | Toute réception sans fournisseur choisi (vérifié aussi par le serveur) |
| Stock de départ | « Stock déjà en magasin (avant Daftar) » après une première réception chez un fournisseur |
| Supprimer un article | S'il reste du stock, ou un achat impayé |
| Supprimer un fournisseur | Tant qu'on lui doit de l'argent |
| Clôturer un inventaire | Si rien n'a été pointé |

## Ventes, retours, factures

| Règle | Ce qui est refusé |
| --- | --- |
| Client nommé | Un crédit ou une livraison sans nom |
| Ville de livraison | Un envoi sans ville |
| Téléphone | Un numéro qui n'est pas marocain |
| Retour tardif | Par le vendeur au-delà du délai réglé, 7 jours par défaut |
| Retour unique | Un deuxième retour sur un ticket déjà retourné |
| Facture unique | Une deuxième facture sur le même ticket, ou une facture sur un ticket retourné |
| Numérotation | Une facture ne se supprime pas : un retour produit un avoir |
| ICE | Un ICE qui ne fait pas 15 chiffres |
| Date de réparation | Une réparation datée dans le futur |

## Accès

Ce que le mode vendeur cache ou refuse : les prix d'achat, les marges,
l'analyse, la comptabilité, les factures, l'export, les suppressions, la
correction manuelle des quantités, les réglages, et les retours au-delà du
délai.

Le patron règle deux nombres dans Réglages : la remise maximale du vendeur
(10 % par défaut) et le délai de retour (7 jours). Un code à quatre chiffres
protège le retour en mode patron.

Sans compte, c'est un verrou d'affichage sur un seul téléphone, pas une
sécurité. Avec un compte en ligne, le rôle vient du serveur : un compte
vendeur ne peut pas repasser en patron, et son téléphone ne reçoit jamais les
prix d'achat, les achats ni le journal (voir `docs/base-de-donnees.md`).

| Règle en ligne | Ce qui est refusé |
| --- | --- |
| Numéro unique | Deux tickets ou deux factures avec le même numéro dans un magasin |
| Facture intouchable | Modifier ou supprimer une facture ou un avoir déjà envoyé |
| Suppression | Un article ou un fournisseur supprimé par un vendeur |
| Dernier patron | Retirer ou rétrograder le dernier patron d'un magasin |
| Équipe | Ajouter quelqu'un qui n'a pas encore créé son compte |
| Magasin en ligne | « Remettre les exemples » et « Tout vider », qui effaceraient chez toute l'équipe |
| Réglages du magasin | Nom, facturation, remise maximale, délai de retour changés par un autre que le patron |
| Vente encaissée | Supprimer un ticket ou une écriture du journal ; changer les montants d'un ticket (même le patron : retour ou échange) |
| Lecture par IA | Plus de 60 analyses de fiche par magasin et par jour ; un compte qui n'est ni patron ni vendeur du magasin |
