import { NextRequest, NextResponse } from "next/server";
import { finishAuth } from "../../../enablebanking/connection";
import { requireUserId } from "../../../lib/current-user";

// Le retour de la banque. `state` rapporte la connexion créée avant la redirection ;
// finishAuth vérifie qu'elle appartient bien à celui qui revient.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state) return NextResponse.redirect(new URL("/app/settings?error=missing_code", req.url));
  try {
    const userId = await requireUserId();
    await finishAuth(code, state, userId);
    return NextResponse.redirect(new URL("/app/settings?connected=1", req.url));
  } catch {
    return NextResponse.redirect(new URL("/app/settings?error=auth_failed", req.url));
  }
}
