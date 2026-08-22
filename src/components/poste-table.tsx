import { cn } from "@/lib/utils";
import { MontantAttrapable } from "@/components/montant-attrapable";

export type LignePoste = {
  id: number;
  nom: string;
  montants: number[];
  // Les quatre états de la structure : acquis et engagé portent, attendu dort,
  // dépassé a rompu. Ce sont les mêmes mots dans toute l'app.
  etat: "acquis" | "attendu" | "engagé" | "dépassé";
};

// LE RELEVÉ D'UN SENS. Une ligne par poste, l'état gravé au milieu, les montants
// à droite en chasse fixe pour que la colonne se lise verticalement.
export function PosteTable({
  titre,
  colonnes,
  lignes,
  vide,
}: {
  titre: string;
  colonnes: string[];
  lignes: LignePoste[];
  vide: string;
}) {
  return (
    // min-w-0 : sans lui, la table interne impose sa largeur à la plaque, qui
    // déborde alors de la grille et pousse toute la page hors de l'écran.
    <section className="plate flex min-w-0 flex-col px-3 py-4 sm:px-5">
      <h2 className="chip self-start">{titre}</h2>
      {lignes.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">{vide}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-rule-strong border-b">
                <th className="caption py-1.5 text-left font-medium">Poste</th>
                {/* Sous 640 px, l'état descend sous le nom du poste : gardé en
                    colonne, il repoussait « Reste » hors de l'écran — or c'est
                    le chiffre pour lequel on ouvre l'app. */}
                <th className="caption hidden py-1.5 text-left font-medium sm:table-cell">État</th>
                {/* Sur téléphone, une seule colonne de chiffres survit : la
                    dernière, « Reste » ou « Reçu », celle pour laquelle on ouvre
                    l'app. Les colonnes de contexte poussaient justement celle-là
                    hors de l'écran. */}
                {colonnes.map((c, i) => (
                  <th
                    key={c}
                    className={cn(
                      "caption py-1.5 text-right font-medium",
                      i < colonnes.length - 1 && "hidden sm:table-cell",
                    )}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.id} className="border-border hover:bg-muted/60 border-b last:border-0">
                  <td className="max-w-[12rem] py-1.5 pr-2">
                    <span className="block truncate">{l.nom}</span>
                    <span
                      className={cn(
                        "chip mt-1 sm:hidden",
                        l.etat === "attendu" && "chip-slack",
                        l.etat === "dépassé" && "chip-tension",
                      )}
                    >
                      {l.etat}
                    </span>
                  </td>
                  <td className="hidden py-1.5 pr-2 sm:table-cell">
                    <span
                      className={cn(
                        "chip",
                        l.etat === "attendu" && "chip-slack",
                        l.etat === "dépassé" && "chip-tension",
                      )}
                    >
                      {l.etat}
                    </span>
                  </td>
                  {l.montants.map((m, i) => (
                    <td
                      key={i}
                      className={cn(
                        "py-1.5 pl-3 text-right font-mono text-[0.8125rem] whitespace-nowrap",
                        i < l.montants.length - 1 && "hidden sm:table-cell",
                        m < 0 && "text-tension-ink",
                        m === 0 && "text-muted-foreground",
                      )}
                    >
                      {/* Chaque montant s'attrape et se tire dans la calculatrice de
                          brouillon, avec le nom de son poste et celui de sa colonne :
                          « Courses · Reste » se lit tout seul une fois là-bas. Cette
                          table est rendue sur le serveur : le geste vit dans son
                          propre composant client (cf. MontantAttrapable). */}
                      <MontantAttrapable libelle={`${l.nom} · ${colonnes[i]}`} montant={m} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
