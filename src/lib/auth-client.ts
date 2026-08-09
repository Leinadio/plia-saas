"use client";
import { createAuthClient } from "better-auth/react";

// Le pendant navigateur de src/lib/auth.ts. Il parle à /api/auth et ne connaît rien
// de la base. Toute la vérité reste côté serveur : ce client sert à poster un
// formulaire et à savoir si quelqu'un est connecté, jamais à décider d'un droit.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
