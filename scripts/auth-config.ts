// Le même montage d'authentification que l'application, mais sous la forme qu'attend
// l'outil de Better Auth : une instance exportée sous le nom `auth`.
//
// L'application, elle, ne construit la sienne qu'à la première requête reçue — exiger
// une base joignable au chargement d'un module rendrait la moitié des tests
// impossibles. L'outil, lui, veut une valeur toute faite.
//
// Sert à fabriquer les tables de connexion :
//
//   node --env-file=.env.local scripts/appliquer-auth.mjs
import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { OPTIONS_AUTH } from "../src/lib/auth";

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  ...OPTIONS_AUTH,
});
