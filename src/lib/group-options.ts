// --- Les groupes proposés à une transaction ---------------------------------
// Un groupe a une durée de vie (cf. isGroupAlive). Le menu de rattachement d'une
// transaction ne propose donc que les groupes qui existent LE MOIS de cette
// transaction : une enveloppe créée pour le seul mois de juillet n'a rien à faire
// dans le menu d'une dépense d'août, où elle ne compterait nulle part.
import { isGroupAlive } from "./forecast";

type Bornes = { id: number; startMonth?: string | null; endMonth?: string | null };

// attachedGroupId : le groupe auquel la transaction est DÉJÀ rattachée. Il reste
// proposé même s'il ne vit plus ce mois-là (bornes changées après coup), sinon le
// menu afficherait un choix vide alors que la transaction est rattachée — et le
// prochain changement effacerait ce rattachement sans que personne l'ait demandé.
export function groupsForMonth<T extends Bornes>(
  groups: T[],
  month: string,
  attachedGroupId?: number | null,
): T[] {
  return groups.filter((g) => isGroupAlive(g, month) || g.id === attachedGroupId);
}

// --- Les postes proposés à une saisie manuelle -------------------------------
// La feuille de saisie ne proposait que les postes du sens saisi : une entrée
// n'avait que des revenus où aller, et un remboursement noté à la main ne pouvait
// pas rejoindre la dépense qu'il rembourse. Le sens ne filtre donc plus rien — il
// range. Ce qu'une transaction pèse dans son poste se compte de toute façon dans le
// sens de CE poste (cf. partDansLePoste), et une entrée posée sur une dépense la
// diminue au lieu de la gonfler.
//
// Le compte et la durée de vie, eux, filtrent toujours : un poste d'un autre compte
// ne concerne pas cette transaction, et un poste qui ne vit pas ce mois-là ne
// compterait nulle part. Sans date saisie, on ne sait pas de quel mois il s'agit :
// rien n'est écarté à ce titre.
type PosteLike = Bornes & { accountId: string; direction: "in" | "out" };

export function postesPourSaisie<T extends PosteLike>(
  groups: T[],
  accountId: string,
  month: string | null,
  attachedGroupId?: number | null,
): { label: string; groups: T[] }[] {
  const duCompte = groups.filter((g) => g.accountId === accountId);
  const vivants = month ? groupsForMonth(duCompte, month, attachedGroupId) : duCompte;
  // L'ordre du tableau : ce qui rentre d'abord, ce qui sort ensuite.
  return [
    { label: "Revenus", groups: vivants.filter((g) => g.direction === "in") },
    { label: "Dépenses", groups: vivants.filter((g) => g.direction === "out") },
  ].filter((s) => s.groups.length > 0);
}
