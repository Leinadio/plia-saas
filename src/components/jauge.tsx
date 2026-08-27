import { partsJauge } from "@/lib/jauge";
import { cn } from "@/lib/utils";

// LA JAUGE D'ENVELOPPE — la pièce signature de l'écran.
//
// Une piste creusée large de l'enveloppe, ce qui en est sorti dedans, et, quand
// la dépense passe le budget, un DÉBORD rouge posé à droite de la piste plutôt
// qu'un remplissage écrasé dedans. Une barre de progression ordinaire s'arrête à
// cent pour cent : elle sait dire qu'un poste a rompu, pas de combien. Celle-ci
// le dit, parce que la barre entière vaut la dépense (cf. lib/jauge).
//
// Elle ne remplace jamais les chiffres : le budget, le dépensé et le reste sont
// écrits en toutes lettres à côté d'elle. Retirez la jauge, la ligne se lit
// encore — c'est la condition pour qu'elle ait le droit d'être là.
export function Jauge({
  budget,
  depense,
  className,
}: {
  budget: number;
  depense: number;
  className?: string;
}) {
  const p = partsJauge(budget, depense);
  // Une enveloppe intacte et sans budget n'a rien à montrer : une piste vide de
  // bout en bout est une ligne grise qui ne dit rien et qu'on prend pour un
  // séparateur.
  if (budget <= 0 && depense <= 0) return null;
  // Rompue : la barre entière passe au rouge, la part budgétée à l'encre de
  // tension et le débord au rouge vif. C'est la marque la plus lourde de la
  // carte, et c'est bien ce qu'on vient y chercher.
  const rompue = p.debord > 0;
  return (
    <div className={cn("jauge", className)} aria-hidden>
      {p.piste > 0 && (
        <div className="jauge-piste" style={{ width: `${p.piste}%` }}>
          <div
            className={cn("jauge-part", rompue && "jauge-part-rompue")}
            style={{ width: `${p.part}%` }}
          />
        </div>
      )}
      {p.debord > 0 && <div className="jauge-debord" style={{ width: `${p.debord}%` }} />}
    </div>
  );
}

// LA JAUGE D'UNE ENTRÉE. Le même dessin, l'autre sens : une entrée n'a pas de
// budget qu'on épuise, elle a un montant attendu qu'on encaisse. Rien ne déborde
// jamais — un trop-perçu n'est pas une rupture — donc la piste occupe toujours
// toute la barre et se remplit en vert jusqu'à ce que la somme soit rentrée.
export function JaugeEntree({
  attendu,
  recu,
  className,
}: {
  attendu: number;
  recu: number;
  className?: string;
}) {
  if (attendu <= 0 && recu <= 0) return null;
  const part = attendu <= 0 ? 100 : Math.min(100, Math.max(0, (recu / attendu) * 100));
  return (
    <div className={cn("jauge", className)} aria-hidden>
      <div className="jauge-piste" style={{ width: "100%" }}>
        <div className="jauge-part jauge-part-portant" style={{ width: `${Math.round(part * 10) / 10}%` }} />
      </div>
    </div>
  );
}
