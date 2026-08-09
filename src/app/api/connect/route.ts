import { NextRequest, NextResponse } from "next/server";
import { startAuth } from "../../../enablebanking/connection";
import { requireUserId } from "../../../lib/current-user";

// Demande une autorisation à une banque. Le nom et le pays viennent de l'appelant :
// c'est ce qui permettra à l'écran de choix de proposer les 128 banques du catalogue.
// Sans eux, on retombe sur la banque de .env.local.
export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  try {
    const body = await req.json().catch(() => ({}));
    const { url } = await startAuth(userId, body.aspspName, body.aspspCountry);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
