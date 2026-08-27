import type { RecapCompte } from "@/lib/recap-compte";
import { Horizon } from "@/components/horizon";
import { RelevesBand } from "@/components/releves-band";
import { CartePostes } from "@/components/carte-postes";

// LE RÉCAPITULATIF D'UN COMPTE, à l'écran.
//
// Trois temps, dans cet ordre : où l'on va (l'horizon des prochains mois), où
// l'on en est (les relevés du mois), puis de quoi c'est fait (les enveloppes).
// La question qu'on se pose en ouvrant l'app — « est-ce que je peux dépenser » —
// trouve sa réponse dans les deux premiers écrans de hauteur ; le troisième sert
// à savoir quoi corriger.
//
// Un compte, une structure : c'est le même bloc pour tous, seuls les chiffres
// changent (cf. lib/recap-compte).
export function RecapitulatifCompte({ recap }: { recap: RecapCompte }) {
  return (
    <div className="flex flex-col gap-3">
      <Horizon mois={recap.mois} />

      <RelevesBand releves={recap.releves} />

      {/* Les sorties d'abord sur téléphone : c'est là que ça déborde, et c'est
          pour ça qu'on est venu. Côte à côte dès qu'il y a la place, les entrées
          à gauche — on lit ce qui rentre avant ce qui sort. */}
      <div className="grid gap-3 xl:grid-cols-2">
        <CartePostes
          titre="Entrées du mois"
          sens="entrees"
          vide="Aucune entrée déclarée ce mois-ci. Déclare ce que tu attends — une mission, une allocation — et l'horizon en tiendra compte."
          colonnes={["Prévu", "Reçu"]}
          lignes={recap.entrees}
        />
        <CartePostes
          titre="Enveloppes du mois"
          sens="sorties"
          vide="Aucune enveloppe ce mois-ci. Une enveloppe, c'est un montant qu'on se donne pour un poste : la jauge dit ce qu'il en reste, et ce qui a débordé."
          colonnes={["Enveloppe", "Dépensé", "Reste"]}
          lignes={recap.sorties}
        />
      </div>
    </div>
  );
}
