import type { RecapCompte } from "@/lib/recap-compte";
import { PlanDeCharge } from "@/components/plan-de-charge";
import { RelevesBand } from "@/components/releves-band";
import { PosteTable } from "@/components/poste-table";

// LE RÉCAPITULATIF D'UN COMPTE, à l'écran. Le plan de charge en tête, la bande
// de relevés dessous, puis les deux tables du mois : ce qui porte à gauche, ce
// qui tire à droite. Un compte, une structure — c'est le même bloc pour tous,
// seuls les chiffres changent (cf. lib/recap-compte).
export function RecapitulatifCompte({ recap }: { recap: RecapCompte }) {
  return (
    <div className="flex flex-col gap-4">
      <PlanDeCharge mois={recap.mois} />

      <RelevesBand releves={recap.releves} />

      <div className="grid gap-4 xl:grid-cols-2">
        <PosteTable
          titre="Entrées"
          vide="Aucune entrée prévue ce mois-ci."
          colonnes={["Prévu", "Reçu"]}
          lignes={recap.entrees}
        />
        <PosteTable
          titre="Sorties"
          vide="Aucune enveloppe ce mois-ci."
          colonnes={["Enveloppe", "Dépensé", "Reste"]}
          lignes={recap.sorties}
        />
      </div>
    </div>
  );
}
