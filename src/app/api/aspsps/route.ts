import { NextResponse } from "next/server";
import { ebGet } from "../../../enablebanking/client";
import { requireUserId } from "../../../lib/current-user";
import type { Banque } from "../../../lib/banques";

// Le catalogue des banques auxquelles l'application a droit. Il dépend de
// l'environnement Enable Banking et de l'état de l'application, donc il se demande à
// eux plutôt que de vivre en dur ici.
//
// Passe par le serveur et jamais par le navigateur : l'appel est signé avec la clé
// privée de l'application, qui ne doit pas en sortir.
export async function GET() {
  await requireUserId();
  const pays = process.env.ENABLEBANKING_ASPSP_COUNTRY ?? "FR";
  try {
    const data = await ebGet<{ aspsps?: Banque[] }>(`/aspsps?country=${pays}`);
    const banques = (data.aspsps ?? []).map((a) => ({ name: a.name, country: a.country ?? pays }));
    return NextResponse.json({ banques });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
