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

Attention : c'est un verrou d'affichage sur un seul téléphone, pas une
sécurité. Les vrais comptes viendront avec le serveur.
