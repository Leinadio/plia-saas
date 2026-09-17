---
version: 1
slug: "src-app-securite-page-tsx"
primary_target: "src/app/securite/page.tsx"
related_targets: ["src/app/securite/page.module.css","src/components/public-accordion.tsx","src/components/public-accordion.module.css","src/components/landing-header.tsx","src/components/landing.module.css","src/components/landing-layout.module.css","src/components/landing-bank-sync.tsx"]
---

## Portée et autorité — 17 septembre 2026

Page publique `/securite`, destinée à expliquer les protections avant de connecter
une banque. Elle hérite de « La lumière en mouvement » : titres Bricolage,
texte Schibsted, eucalyptus en clair, anthracite et sable en sombre, surfaces
opaques, filets et commandes en capsule. Le lien d’entrée vient de la réassurance
bancaire de l’accueil. Le CSS implémenté fait autorité ; aucune nouvelle palette
ni photographie n’est introduite.

## Composition

Le titre « Votre budget est personnel. Vos données le restent. » accompagne un
panneau d’engagements. Une séquence banque → prestataire AISP → espace Planora
explique le consentement et les responsabilités ; l’acronyme est développé et
un lien ACPR documente le service d’information sur les comptes. La bande sombre
présente l’identité, la séparation des données et les échanges bancaires HTTPS.
Viennent ensuite quatre usages des données, le choix entre saisie manuelle et
connexion bancaire avec FAQ, puis le contact et le pied de page commun.

Le haut de page utilise deux colonnes (1.2fr / 0.9fr), les étapes trois colonnes.
Les titres principaux mesurent 72 px, puis 56 px sous 1100 px, 48 px sous 800 px
et 40 px sous 380 px. Sous 800 px, les sections et les étapes s’empilent ; les
usages des données placent leur description sous le libellé. Les panneaux gardent
des arrondis de 16 px, les encarts de lecture seule de 12 px. Le contact termine
le parcours sur un fond chaud, avec une action visible vers `/contact`.

## Interactions et limites des affirmations

Les quatre questions partagent l’accordéon de l’accueil : bouton natif React,
`aria-expanded`, `aria-controls`, région nommée et réponse fermée `aria-hidden`
et `inert`. La grille passe entre 0fr et 1fr en 320 ms, l’opacité en 200 ms et
le signe pivote en 280 ms ; le mouvement réduit supprime ces transitions.
Les liens du pied de page alignent texte et flèche avec une cible de 44 px.

Les affirmations reposent sur l’authentification de l’utilisateur, la propriété
des comptes et opérations, les contrôles applicatifs et RLS, et les requêtes
bancaires HTTPS signées côté serveur. Le texte public parle du prestataire AISP
sans le nommer ; l’intégration interne Enable Banking reste inchangée. La page
ne revendique ni certification, ni chiffrement au repos, ni absence de risque.
Elle précise la lecture seule, l’absence de virement, la synchronisation différée
et le renouvellement éventuel de l’autorisation. Les demandes relatives aux
données passent par le contact, sans promettre une action automatique inexistante.

## Vérification

La revue de cette passe conclut **SHIP**, sans défaut matériel à 1440, 390 et
320 px en clair et à 390 px en sombre. Elle couvre la page, les deux FAQ,
la réassurance bancaire scindée et les flèches du pied de page.
