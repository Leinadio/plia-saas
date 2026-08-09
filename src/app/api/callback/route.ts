import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { finishAuth } from "../../../enablebanking/connection";
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
    await finishAuth(code, state, userId);
    revalidatePath("/app", "layout");
    return NextResponse.redirect(new URL("/app/settings?connected=1", req.url));
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
