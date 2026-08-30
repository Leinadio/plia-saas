import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { finishAuth } from "../../../enablebanking/connection";
import { syncConnections } from "../../../enablebanking/sync-connections";
import { ebGet } from "../../../enablebanking/client";
import { db } from "../../../db/index";
import { requireUserId } from "../../../lib/current-user";

// Le retour de la banque. `state` rapporte la connexion créée avant la redirection ;
// finishAuth vérifie qu'elle appartient bien à celui qui revient.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state) return NextResponse.redirect(new URL("/app/settings?error=missing_code", req.url));

  // HORS du try. requireUserId redirige quand la session manque, et Next fait ça en
  // levant une exception : attrapée ici, elle deviendrait un « échec d'autorisation »
  // alors que le seul problème est qu'on n'est plus connecté — ce qui arrive en
  // passant de HTTP à HTTPS, puisque le cookie ne suit pas d'une origine à l'autre.
  const userId = await requireUserId();

  try {
    const connectionId = await finishAuth(code, state, userId);

    // La première synchronisation se lance ici, sans attendre un clic : autoriser sa
    // banque et se retrouver devant un écran vide n'a aucun sens, et le bouton
    // « Synchroniser » qu'on affichait à la place ne le disait pas.
    //
    // Son propre try : l'autorisation, elle, a bel et bien réussi. La faire passer
    // pour un échec parce que l'import a buté ferait recommencer tout le parcours
    // chez la banque pour rien.
    let imported: number | null = null;
    try {
      const res = await syncConnections(db(), { ebGet, userId, connectionId });
      imported = res.imported;
    } catch (e) {
      console.error("[callback] première synchronisation échouée :", e);
    }

    revalidatePath("/app", "layout");
    // Le premier retour mène à la valeur, pas à l'administration de la connexion :
    // le tableau de bord montre immédiatement la projection que l'autorisation vient
    // de rendre possible. Les réglages restent disponibles depuis la barre du haut.
    const url = new URL("/app/historique?connected=1", req.url);
    if (imported !== null) url.searchParams.set("imported", String(imported));
    return NextResponse.redirect(url);
  } catch (e) {
    // Journalisé côté serveur : sans ça, l'écran annonce un échec et la raison se perd.
    // La banque est seule à savoir pourquoi elle a refusé, autant garder ce qu'elle dit.
    console.error("[callback] autorisation non finalisée :", e);
    const raison = e instanceof Error ? e.message : "inconnue";
    return NextResponse.redirect(
      new URL(`/app/settings?error=${encodeURIComponent(raison.slice(0, 200))}`, req.url),
    );
  }
}
