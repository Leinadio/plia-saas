# Reconnecter une banque sans perdre son budget

Demande approuvée : ajouter le mécanisme de reconnexion décrit dans le diagnostic.
Le bouton Reconnecter sur une banque ouvre une nouvelle autorisation pour cette
banque. L'ancienne autorisation et ses comptes restent intacts si le parcours est
abandonné. Au retour, les comptes sont reconnus par leur identification_hash
principal Enable Banking, dans le périmètre de l'utilisateur et de la banque.
Ni le nom ni les quatre derniers chiffres d'IBAN ne suffisent à une fusion.

L'identifiant local du compte et des opérations reste stable. Un champ séparé
porte l'identifiant bancaire propre à la session. Les anciennes identités peuvent
être retrouvées par GET /sessions/{id}, y compris pour les sessions fermées ; ce
chemin a été vérifié en lecture sur les deux connexions CIC concernées.

Synchroniser répare aussi les doublons déjà présents dont l'identité est prouvée.
L'ancien compte conserve son alias, ses enveloppes et les décisions sur les
opérations. Les opérations et enveloppes propres au doublon sont transférées.
Une opération déjà présente n'est pas comptée deux fois. Un conflit de données ou
de classements explicites bloque la fusion avec un message, sans écriture partielle.
Une identité manquante bloque l'ajout d'un doublon potentiel, jamais une fusion
par ressemblance. Une banque expirée n'empêche pas les banques valides de se mettre
à jour. Un compte non partagé à nouveau reste conservé sur l'ancienne connexion.

La mise à niveau du schéma est additive et rejouable. Aucun accès bancaire n'est
renouvelé sans l'action de l'utilisateur chez sa banque. Les tests utilisent PGlite
et un faux fournisseur ; le serveur réel vérifie le branchement et l'écran.
