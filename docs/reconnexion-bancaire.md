# Reconnexion bancaire

Dans Réglages, le bouton **Reconnecter** de chaque banque ouvre une nouvelle
autorisation chez cette banque. Il faut sélectionner les comptes à renouveler.
Au retour, les comptes déjà connus gardent leurs enveloppes, leur nom personnalisé
et le classement des opérations. Un compte non partagé reste conservé sur son
ancienne connexion, avec l'avertissement d'expiration.

Si la banque avait déjà été reconnectée et apparaît deux fois, **Synchroniser**
rattache les comptes dont l'identité bancaire est identique. Les deux ensembles
d'enveloppes sont conservés. Les opérations de même référence ne sont pas
comptées deux fois. Une décision contradictoire sur une opération ou une provision
interrompt le rattachement de ce compte sans fusion partielle et indique quoi
harmoniser. Ne pas utiliser Débrancher pour réparer un doublon : il supprime les
données de la connexion.

## Installation

Avant de déployer le code, exécuter :

```sh
node --env-file=.env.local scripts/appliquer-reconnexion.mjs
```

La migration ajoute seulement `accounts.bank_uid`,
`accounts.identification_hash` et `bank_connections.sync_pending_uids`. Elle est
rejouable et ne modifie aucun solde, compte ou budget. L'installation complète via
`scripts/appliquer-schema.mjs` contient aussi ces ajouts.

## Identification et conservation

L'identifiant local reste stable. Les appels bancaires utilisent `bank_uid`, qui
change avec la session. L'empreinte principale `identification_hash` est comparée
uniquement pour le même utilisateur, la même banque et le même pays ; une devise
différente bloque le rattachement. Les empreintes secondaires ne sont pas utilisées
car Enable Banking ne garantit pas leur unicité. Les anciens comptes récupèrent
leur empreinte par GET `/sessions/{id}`, y compris lorsque la session est fermée.
Un nom ou un IBAN masqué ne prouve jamais qu'il s'agit du même compte.

Les références d'opérations restent préfixées par l'identifiant local. Les
écritures d'un compte sont groupées dans une transaction après les appels réseau.
Les budgets datés, opérations manuelles, commentaires, choix en attente,
automatisations, rapprochements ignorés et voyages éventuels sont transférés lors
de la réparation d'un doublon. Une connexion n'est retirée que lorsqu'aucun compte
n'en dépend plus. Les comptes restant à importer sont mémorisés pour reprendre
une première synchronisation interrompue.

Référence : [réautorisation et identification des comptes Enable Banking](https://enablebanking.com/docs/faq/#how-should-re-authorisation-be-performed-and-how-to-match-accounts-across-sessions).
