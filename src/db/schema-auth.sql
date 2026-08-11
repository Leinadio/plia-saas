-- --- Les tables de connexion --------------------------------------------------
--
-- Produites par l'outil de Better Auth, pas écrites à la main :
--
--   npx @better-auth/cli generate --config scripts/auth-config.ts
--   node --env-file=.env.local scripts/appliquer-auth.mjs
--
-- Elles vivent dans la même base que le budget mais n'ont rien à voir avec lui, et le
-- rôle bridé de l'application n'y a aucun droit : c'est Better Auth qui s'y branche,
-- avec sa propre connexion.
--
-- Attention au voisinage des noms : `account` au singulier est un moyen de connexion
-- (mot de passe, fournisseur externe), sans aucun rapport avec `accounts`, les comptes
-- bancaires.

create table if not exists "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create table if not exists "session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade);

create table if not exists "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);

create table if not exists "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create index if not exists "session_userId_idx" on "session" ("userId");

create index if not exists "account_userId_idx" on "account" ("userId");

create index if not exists "verification_identifier_idx" on "verification" ("identifier");