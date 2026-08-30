"use client";
// --- Le grand tableau de l'Historique ---------------------------------------
// Composition approuvée le 14/08/2026 : .impeccable/mocks/comp-histo-ac2.png
//
// L'IDÉE : le tableau annonce d'abord où l'on atterrit, puis montre comment on y
// arrive. Un bandeau d'encre traverse le haut, une colonne par mois, trois
// soldes de fin de mois chacun. Sous lui, UN seul tableau — plus un par mois — dont
// la colonne des noms est écrite une fois et reste collée au bord gauche.
//
// CE QUI TIENT TOUT : les colonnes du bandeau SONT celles du tableau. Le bandeau
// vit dans l'en-tête, pas dans une plaque au-dessus, donc un solde et les postes qui
// l'ont fabriqué tombent sur la même verticale sans qu'aucun calcul de largeur ait à
// le garantir. Déplacer le bandeau hors du tableau casse la composition entière.
//
// CE QU'ON REFUSE : réécrire les noms de postes à chaque mois (on lisait trois fois
// « Courses »), et une ligne de pied qui totalise le mois et donne le solde en même
// temps — ce sont deux choses, elles ont deux lignes.
import { Fragment, cloneElement, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ArrowDownRight, ChevronDown, ChevronRight, Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { FORMAT_MONTANT, encoderMontant } from "@/lib/calculatrice";
import { monthLabel } from "@/lib/transactions-view";
import type { AccountForecast } from "@/lib/forecast";
import { type MonthCell, type HistorySection, type HistoryRow, type HistorySubRow, type HistoryTxn, type SoldeColumn, type PlannedSoldes, type Overspend, type IgnoredBlock, uncatOverspend, uncatOverspendOf, computeTableEstimate, rowRevenus, rowOverspend, groupsWithPending } from "@/lib/history";
import { sectionSlots, countIgnoredAtMonth, ligneVivante } from "@/lib/history-month-view";
import { groupsForMonth } from "@/lib/group-options";
import { groupPeriodLabel } from "@/lib/group-period-label";
import { soldeCell } from "@/lib/solde-cell";
import { notificationId } from "@/lib/notifications";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TruncatedText } from "@/components/truncated-text";
import { TxnCommentField } from "@/components/txn-comment-field";
import { GroupSelectField } from "@/components/group-select-field";
import { IgnoreTxnToggle } from "@/components/ignore-txn-toggle";
import { NewGroupInline } from "@/components/new-group-inline";
import { NewLineInline } from "@/components/new-line-inline";
import { type ColKey, monthType, monthColumns, COL_LABEL, COL_INFO } from "@/lib/history-columns";
import { computeRevealKeys, computePrevDisplayed, rowOpenKey, lineOpenKey, uncatOpenKey, highlightedCells, rowKeyOf, withRevealed , openKeyIn } from "@/lib/history-nav";
import {
  netCol,
  txnChildren,
  budgetNodes,
  groupNode,
  negateNode,
  sectionRowKey,
  sectionLabel,
  uncatTxnNodes,
  sectionTxnChildren,
  txnsDuSens,
  resteParts,
  sectionNode,
  soldeActuelDetail,
  budgetEditOfGroup,
  budgetEditOfLine,
} from "@/lib/history-detail";
import {
  type CellDetail,
  type DetailNode,
  type Col,
  type BudgetEditInfo,
  type OverspendNoticeInfo,
  cellKey,
  openingRow,
  sectionRow,
  groupRow,
  subRow,
  txnRow,
  makeDetail,
  makeInfo,
  txnNode,
} from "@/lib/history-explain";
import { type BudgetChange } from "@/lib/budget-history";

// Décision déjà prise sur un dépassement (groupId, mois), telle que chargée en page
// (Task 4). groupId = 0 pour les non catégorisés.

// Groupes du compte, pour le menu de (ré)assignation sur chaque transaction et la
// gestion d'un groupe (Task 6 : kind + lignes complètes pour alimenter le side panel).
export type SelectGroup = {
  id: number;
  name: string;
  // Sens du groupe : sépare les rémunérations des dépenses dans le menu de
  // rattachement (cf. src/lib/group-select-options.ts).
  direction: "in" | "out";
  // Durée de vie : le menu d'une transaction ne propose que les groupes qui vivent
  // son mois (cf. src/lib/group-options.ts).
  startMonth?: string | null;
  endMonth?: string | null;
  changes: BudgetChange[];
  // Les lignes portent leur propre durée de vie, comme le groupe la sienne : c'est
  // elle qu'affiche la colonne de gauche à côté du nom du poste.
  lines: { id: number; name: string; amount: number; startMonth?: string | null; endMonth?: string | null; changes: BudgetChange[] }[];
};
// Surbrillance de la case sélectionnée depuis le side panel : un anneau seul. Le fond
// teinté qui l'accompagnait est parti avec les autres couleurs de fond — l'anneau
// désigne la case aussi bien, et c'est un état, pas une couleur de tableau.
const CELL_HL = "ring-1 ring-inset ring-primary/60";

// Portée d'un dépliage. Il y a eu un tableau par mois, et un dépliage valait pour
// son mois seulement. Il n'y en a plus qu'un : une ligne n'existe qu'une fois et se
// déplie une fois. Le jeton garde la forme de clé attendue par openKeyIn.
const PARTOUT = "*";

// « 2026-07 » → « Juillet ». L'année est affichée à part dans l'en-tête, en
// chasse fixe et en retrait, pour que le nom du mois porte seul le titre.
function monthName(ym: string): string {
  const s = monthLabel(ym);
  return s.replace(/\s+\d{4}$/, "");
}

const NUM = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (n: number) => NUM.format(Math.abs(n) < 0.005 ? 0 : n).replace(/[  ]/g, " ");

// Couleur d'un montant « Reste/Manque » : rouge s'il manque (négatif), vert sinon
// (reste positif ou à zéro).
function resteColor(v: number): string {
  return v < -0.005 ? "text-tension-encre" : "text-foreground";
}

// Couleur de fond d'une case des trois colonnes de solde : rouge si le solde est
// négatif, noir sinon. Rien d'autre — le sens du mouvement se dit sur l'opérateur, et
// c'est SoldeAmount qui le pose, morceau par morceau. Une couleur unique pour toute la
// case ne pouvait porter qu'une des deux informations à la fois.
function soldeColor(v: number | null | undefined): string | undefined {
  if (v == null) return undefined;
  return v < -0.005 ? "text-tension-encre" : undefined;
}

// Étiquette posée sous un montant de Balance en dépassement. Un simple constat : la
// dépense a dépassé le budget de ce mois-là. Rien à trancher, rien à décider — relever
// un budget pour la suite se fait à la main, dans les cases des mois concernés.
//
// En bloc à part sous le montant plutôt qu'à côté : la colonne est étroite, et une
// étiquette sur la même ligne la ferait s'élargir pour tout le tableau. Ainsi seule la
// hauteur de la ligne augmente, et uniquement là où il y a un dépassement.
function OverspendTag() {
  return (
    <span
      title="La dépense a dépassé le budget de ce mois."
      className="pastille pastille-tension mt-0.5"
    >
      dépassement
    </span>
  );
}

// Largeur fixe de la première colonne. Un conteneur interne à largeur fixe (et non
// un max-width sur la cellule, ignoré en table-auto) garantit que la colonne ne
// bouge pas quand on déroule des transactions à long libellé.
// Deux largeurs : 320 px partout, 176 px sur téléphone. À 320 px, la colonne des
// noms mangeait un écran de 375 px entier et il ne restait rien pour les chiffres,
// qui sont ce qu'on vient lire. Les noms trop longs se coupent, et un tap les
// déplie (cf. TruncatedText).
// 176 px sur téléphone, 320 au-delà. L'épine mange la largeur qui reste aux
// chiffres, mais on ne la rétrécit pas davantage : un poste qu'on n'arrive plus
// à nommer ne sert à rien. Ce sont les DEUX autres locataires de cette colonne
// qu'on renvoie sur téléphone — la flèche de sens et l'étiquette de durée — et
// c'est là qu'on récupère de la place, pas sur le nom.
const COL1_W = "w-44 sm:w-80";

// À partir de 640 px, la colonne des noms reste collée au bord gauche pendant que
// les mois défilent sous elle. C'est la contrepartie du tableau unique : les noms ne
// sont plus écrits qu'une fois, donc ils doivent rester lisibles quel que soit le mois
// qu'on regarde. Sans ça, défiler jusqu'à septembre laisse des colonnes de chiffres
// sans étiquette.
//
// En dessous, elle défile avec le reste. Figée, elle occupait 176 des 390 pixels d'un
// téléphone en permanence : il ne restait que deux colonnes de chiffres, et des noms
// qu'on gardait sous les yeux au prix des montants qu'on venait lire. Le tableau
// s'ouvre donc sur les noms, et on les quitte en glissant vers les mois (voir aussi
// CenterScroll, qui ne saute au mois courant que si l'épine est figée).
const COL1_STICKY = "sm:sticky sm:left-0 sm:z-10";

// Les titres de bloc (« Dépenses prévues »), leurs boutons de création et les
// formulaires en ligne vivent dans une cellule qui traverse tout le tableau. Leur
// contenu se posait donc à la gauche ABSOLUE du tableau — c'est-à-dire hors de
// l'écran dès qu'on avait fait défiler d'un mois. Collés au bord comme la colonne
// des noms, ils restent là où on les cherche.
const BLOC_EPINE = "sm:sticky sm:left-0 sm:z-20";

// La bande de section : une rangée pleine largeur qui nomme ce qui suit, comme un
// titre de chapitre en travers du relevé. Le nom se pose dans l'épine, la teinte
// traverse tous les mois — c'est ce qui fait lire le tableau par bandes horizontales
// et non par colonnes.
const BANDE = "bg-[color-mix(in_oklab,var(--ardoise)_12%,var(--card))]";
const BANDE_TENSION = "bg-tension-voile";
const BANDE_PORTANT = "bg-portant-voile";

// Le pied du tableau, en ENCRE pleine. Les trois dernières lignes sont ce qu'on
// vient chercher ; elles ferment le relevé comme un tampon.
//
// C'est la seule masse d'encre d'un écran de cartes blanches — et en lumière
// éteinte, l'encre étant claire, le tampon s'inverse en bande pâle sur un tableau
// sombre. Ce n'est pas un accident : dans les deux thèmes, le pied est le bloc le
// plus contrasté de l'écran, et c'est cela qu'on veut, pas une couleur.
//
// Les couleurs ne sont pas réécrites case par case : on redéfinit ici les jetons que
// les cellules utilisent déjà. Un montant négatif reste « text-tension-encre », mais
// sur ce fond ce jeton vaut un rouge éclairci — sinon le rouge sombre disparaîtrait
// dans l'encre. Même chose pour le texte et le filet de l'épine.
const PIED_CARBONE = {
  "--foreground": "var(--surface)",
  "--muted-foreground": "color-mix(in oklab, var(--surface) 70%, var(--encre))",
  // Le rouge du pied se mélange à la SURFACE, pas à du blanc en dur. En lumière
  // claire le pied est une masse d'encre et la surface est blanche : le rouge
  // s'éclaircit, sinon il disparaîtrait dans le noir. En lumière éteinte l'encre
  // est claire, le pied s'inverse en bande pâle, et la même expression assombrit
  // le rouge au lieu de le délaver. Une seule ligne pour les deux thèmes.
  "--tension-encre": "color-mix(in oklab, var(--tension) 75%, var(--surface))",
  "--border": "color-mix(in oklab, var(--surface) 26%, var(--encre))",
} as React.CSSProperties;
// L'encre doit être posée explicitement : une cellule hérite sa couleur du corps de
// la page, elle ne relit pas le jeton --foreground qu'on redéfinit ici. Seuls les
// éléments qui appellent un jeton (text-muted-foreground, text-tension-encre) suivent.
// L'encre claire se pose sur la LIGNE, pas sur chaque cellule : posée sur les
// cellules, elle écrasait le rouge d'un montant négatif, qui est justement ce qu'on
// vient lire ici. Héritée, elle cède la place à toute cellule qui a son propre avis.
const PIED_LIGNE = "text-[var(--surface)] [&>td]:bg-encre";


// Le modèle de colonnes (quelles colonnes sous quel mois, leur libellé et leur
// explication) vit dans src/lib/history-columns.ts : c'est une règle, pas du rendu.


// Le fond ne dit plus qu'une chose, mais il la dit bien : à quelle famille appartient
// une colonne. Trois familles, trois fonds — les colonnes de mouvement du mois (tout
// ce qui est à gauche de Balance) en partagent un seul, Balance a le sien, et les
// trois chaînes de solde partagent le dernier. Rien d'autre n'est teinté : ni la
// nature du mois, ni le bloc entrant/sortant, ni les bandes de totaux.
//
// Posés sur CHAQUE cellule (via renderCols) plutôt que sur le <colgroup> : un fond de
// cellule recouvre celui de sa ligne, si bien que la teinte reste lisible partout,
// y compris sous une ligne survolée.
//
// Les familles ne se distinguent plus par la teinte mais par la DENSITÉ : c'est
// la même ardoise, de plus en plus dense. La sarcelle de ce monde ne commande que —
// elle n'a rien à faire dans un fond de colonne — et les deux couleurs de sens
// n'entrent ici que pour les sections et pour les montants négatifs.
const DATA_TINT = "bg-[color-mix(in_oklab,var(--ardoise)_5%,var(--card))]";
const BALANCE_TINT = "bg-[color-mix(in_oklab,var(--ardoise)_11%,var(--card))]";
const SOLDE_TINT = "bg-[color-mix(in_oklab,var(--ardoise)_18%,var(--card))]";
// Fond des lignes de totaux (« Total revenus », « Total Dépenses », « Total »).
// Posé sur les CELLULES et non sur la ligne : chaque cellule de données porte déjà le
// fond de sa colonne, qui recouvrirait celui de la ligne et ne laisserait la teinte
// visible que dans les trous. Plus soutenu que DATA_TINT, pour que l'œil trouve les
// totaux sans avoir à lire les libellés.
const TOTAL_TINT = "bg-[color-mix(in_oklab,var(--ardoise)_24%,var(--card))]";

// Fond des deux grandes sections. Il ne remplace QUE DATA_TINT — les colonnes de
// données et celle du nom : Balance et Solde gardent leur ambre et leur bleu, qui
// disent autre chose et doivent rester lisibles d'une section à l'autre.
// Plus pâles que les teintes de colonne, exprès : elles situent, elles ne signalent
// rien. Le mélange se fait avec --background, donc elles suivent le thème.
// Ce qui porte reste à l'encre neutre ; ce qui tire prend le rouge de tension,
// très dilué. C'est la seule couleur du tableau, et elle ne dit qu'une chose.
// La teinte d'une section ne lave QUE les colonnes de données — ce qu'on a prévu et
// ce qu'on a fait. Deux couleurs, deux forces : ce qui PORTE (les rentrées) prend le
// vert du portant, ce qui TIRE (les deux blocs de dépenses) prend le rouge de
// tension. Très diluées toutes les deux : elles situent une ligne, elles ne jugent
// pas un montant.
const INCOME_TINT = "bg-[color-mix(in_oklab,var(--portant)_7%,var(--card))]";
const EXPENSE_TINT = "bg-[color-mix(in_oklab,var(--tension)_5%,var(--card))]";
// Trois crans par couleur, du plus clair au plus foncé : les lignes de données, le
// sous-total d'un bloc de dépenses, le total de la section. La hiérarchie se lit à la
// densité, pas à la teinte — c'est la même couleur qui s'assombrit, donc l'œil relie
// chaque total à la section qu'il ferme.
const EXPENSE_TOTAL_TINT = "bg-[color-mix(in_oklab,var(--tension)_15%,var(--card))]";
const INCOME_TOTAL_TINT = "bg-[color-mix(in_oklab,var(--portant)_16%,var(--card))]";

// La teinte de la section où l'on se trouve, portée par le contexte plutôt que passée
// de main en main : les lignes s'imbriquent (groupe, sous-poste, transaction) et
// chacune aurait dû la relayer.
const TeinteSection = createContext<string | undefined>(undefined);

// LE MÉLANGE SE FAIT AVEC LA CARTE, PAS AVEC LE SOL. Le tableau vit dans une carte
// blanche posée sur un sol clair : une teinte mélangée au sol tomberait, d'un pour
// cent, à côté de la surface qui la porte, et chaque colonne se décollerait de sa
// propre carte. L'ardoise fournit le gris — c'est le gris de texte du monde, donc
// les fonds restent de la même famille que ce qu'ils portent.
//
// Trois familles de colonnes, trois densités. Ce qu'on a prévu et ce
// qu'on a fait — tout ce qui est à gauche de Balance — partagent le fond le plus
// clair ; Balance, qui tranche entre les deux, en a un à elle ; les trois chaînes
// de solde, qui se lisent de haut en bas comme une opération posée, partagent le
// plus dense. La hiérarchie se lit à la DENSITÉ et non à la teinte : c'est le même
// ardoise qui s'assombrit, parce que l'accent de ce monde ne sert qu'à commander.
const COL_TINT: Record<ColKey, string> = {
  budgetRem: DATA_TINT,
  budgetDep: DATA_TINT,
  dep: DATA_TINT,
  recu: DATA_TINT,
  reste: BALANCE_TINT,
  soldeReel: SOLDE_TINT,
  soldePrevu: SOLDE_TINT,
  soldeDepass: SOLDE_TINT,
};

// Séparation entre deux mois : un filet vertical plus du blanc tournant, posés sur
// la première colonne de chaque mois. Surtout PAS une bande épaisse peinte à la
// couleur du fond : elle perçait les fonds de ligne et coupait les filets
// horizontaux, et comme elle défile avec les colonnes, ça donnait un trou mobile
// qui faisait passer le tableau « en dessous ». Ici la ligne reste continue d'un
// bout à l'autre ; c'est le filet qui détache les blocs.
// Ça évite aussi d'insérer une colonne de séparation dans toute la structure du
// tableau (colgroup, deux rangées d'en-tête, chaque constructeur de ligne, totalCols).
// La séparation entre deux mois : un filet franc, du haut du tableau jusqu'en bas.
// C'est lui qui fait lire trois blocs et non vingt et une colonnes.
const MONTH_RULE = "border-l border-l-filet-fort";
const MONTH_GAP = "border-l border-l-filet-fort pl-4";

// Les intitulés de colonnes tels que la maquette les écrit : courts. Le libellé
// entier vit dans COL_LABEL et reste le titre de l'explication qu'un clic ouvre —
// « SI DÉP. » suffit au-dessus d'une colonne, pas dans un panneau qui explique.
const COL_COURT: Record<ColKey, string> = {
  budgetRem: "Attendu",
  budgetDep: "Budget",
  dep: "Dépensé",
  recu: "Reçu",
  reste: "Balance",
  soldeReel: "Réel",
  soldePrevu: "Prévu",
  soldeDepass: "Si dép.",
};

// Une cellule de tableau, avec sa className.
type ColCell = React.ReactElement<{ className?: string }>;
// Un jeu de slots : une fonction de rendu par colonne, qui reçoit « est-ce la
// première colonne du mois » (bordure de séparation).
export type ColSlots = Record<ColKey, (border: boolean) => ColCell>;

// Rend les cellules d'un mois (une par colonne), chacune sur le fond de sa famille.
// `tint` remplace ce fond pour toute la ligne : c'est ainsi qu'une ligne de totaux
// prend une couleur d'un bout à l'autre au lieu de garder les familles de colonnes.
// tint : une teinte qui couvre TOUTES les colonnes (les lignes de totaux).
// sectionTint : la teinte de la section, qui ne remplace que le fond des colonnes de
// données — Balance et Solde gardent le leur.
function renderCols(cols: ColKey[], slots: ColSlots, tint?: string, sectionTint?: string): React.ReactNode[] {
  return cols.map((col, idx) => {
    const cell = slots[col](idx === 0);
    // Seules les colonnes de données changent de fond selon la ligne ou la section.
    // Balance garde son gris et les trois soldes le leur d'un bout à l'autre du
    // tableau, y compris sur les lignes de sous-total : ce sont des colonnes de
    // lecture verticale, et un repère qui change de couleur tous les six rangs
    // n'est plus un repère.
    const fond = COL_TINT[col] === DATA_TINT ? (tint ?? sectionTint ?? DATA_TINT) : COL_TINT[col];
    // Le fond est posé AVANT la className propre de la cellule, pour que l'anneau de
    // sélection et les bordures restent au-dessus.
    return cloneElement(cell, { className: cn(fond, cell.props.className) });
  });
}

// Cellule vide (colonne non renseignée pour cette ligne), avec bordure de mois si
// c'est la première colonne du mois.
function blankCol(key: string, border: boolean): ColCell {
  return <TableCell key={key} className={cn(border && MONTH_GAP)} />;
}

// Cellule de solde « plan » (prévu / si dépassement) : affichage simple, non
// cliquable, rouge si négatif ; vide si la valeur est nulle (mois avant le courant).
function plannedSoldeCol(key: string, val: number | null | undefined, border: boolean): ColCell {
  return (
    <TableCell key={key} className={cn(border && MONTH_GAP, "text-right tabular-nums", soldeColor(val))}>
      {val != null ? fmt(val) : ""}
    </TableCell>
  );
}

// Jeu de slots (une fonction de rendu par colonne) toutes vides : sert de base aux
// lignes qui ne renseignent qu'une ou deux colonnes (ouverture, lignes du bas).
function blankSlots(): ColSlots {
  return {
    budgetRem: (b) => blankCol("budgetRem", b),
    budgetDep: (b) => blankCol("budgetDep", b),
    dep: (b) => blankCol("dep", b),
    recu: (b) => blankCol("recu", b),
    reste: (b) => blankCol("reste", b),
    soldeReel: (b) => blankCol("soldeReel", b),
    soldePrevu: (b) => blankCol("soldePrevu", b),
    soldeDepass: (b) => blankCol("soldeDepass", b),
  };
}

// Boîte à largeur fixe placée dans la cellule de gauche. Le retrait (indent) est
// appliqué à l'intérieur, donc toutes les cellules gardent la même largeur.
// Filet à droite de la colonne figée : quand le tableau défile horizontalement,
// les mois passent DERRIÈRE cette colonne. Sans séparation, les libellés et les
// chiffres semblent se toucher.
// h-full ne suffit pas seul : dans un <td>, un pourcentage de hauteur se résout
// contre la hauteur INTRINSÈQUE de la cellule, pas contre celle que la ligne lui
// impose. Sur une ligne étirée par une autre colonne (une Balance qui porte son
// étiquette sous le montant), la boîte restait à sa hauteur naturelle et le filet
// s'arrêtait avant le bas — d'où le bout clair au coin. Les cellules de cette
// colonne portent donc `h-px` : la hauteur déclarée rend le 100 % résoluble, et la
// ligne étire la cellule de toute façon puisqu'elle ne peut pas être plus petite
// que son contenu.
function FirstColBox({ children, indent = 0 }: { children: React.ReactNode; indent?: number }) {
  return (
    <div
      className={cn("border-border/60 flex h-full items-center gap-1.5 overflow-hidden border-r py-2 pr-2 font-sans", COL1_W)}
      style={{ paddingLeft: `${0.5 + indent * 1.25}rem` }}
    >
      {children}
    </div>
  );
}

// Cellule de montant : cliquable (sélection → sidebar) si un détail est fourni.
// cellKey (data-cellkey) identifie la case pour la surbrillance croisée et le
// défilement depuis le side panel ; elle s'allume quand elle est la case sélectionnée.
function selectAmountDetail(
  detail: CellDetail,
  cellKey: string | undefined,
  onSelect: (detail: CellDetail) => void,
  onOnboardingSelect?: () => void,
) {
  onSelect(cellKey != null ? { ...detail, cellRef: cellKey } : detail);
  onOnboardingSelect?.();
}

export function CellAmount({ children, className, detail, onSelect, cellKey: ck, selCellKey, onboardingTarget, onboardingGroupId, onboardingMonth, onOnboardingSelect }: {
  children: React.ReactNode;
  className?: string;
  detail?: CellDetail | null;
  onSelect?: (d: CellDetail) => void;
  cellKey?: string;
  selCellKey?: ReadonlySet<string>;
  onboardingTarget?: string;
  onboardingGroupId?: number;
  onboardingMonth?: string;
  onOnboardingSelect?: () => void;
}) {
  const cls = cn(className, ck != null && selCellKey?.has(ck) && CELL_HL);
  if (!detail || !onSelect) return <TableCell data-cellkey={ck} data-onboarding-target={onboardingTarget} data-onboarding-group-id={onboardingGroupId} data-onboarding-month={onboardingMonth} className={cls}>{children}</TableCell>;
  // On rattache la clé de cette case au détail (cellRef), pour pouvoir la surligner
  // depuis la ligne « Total » du side panel.
  //
  // La case est aussi ATTRAPABLE : on la tire dans la calculatrice de brouillon, et
  // elle y arrive avec son libellé. Le détail porte déjà les deux — « Courses ·
  // juillet 2026 » et le montant — donc chaque case chiffrée du tableau devient une
  // réserve sans que personne ait à décrire son contenu une seconde fois.
  return (
    <TableCell data-cellkey={ck} data-onboarding-target={onboardingTarget} data-onboarding-group-id={onboardingGroupId} data-onboarding-month={onboardingMonth} className={cls}>
      <button
        type="button"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(FORMAT_MONTANT, encoderMontant({
            libelle: detail.subtitle ? `${detail.subtitle} · ${detail.title}` : detail.title,
            montant: detail.result,
          }));
          e.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() => selectAmountDetail(detail, ck, onSelect, onOnboardingSelect)}
        className="cursor-pointer decoration-dotted underline-offset-2 hover:underline"
      >
        {children}
      </button>
    </TableCell>
  );
}

// Cellule de solde « plan » (prévu / si dépassement) cliquable : comme
// Solde avec son signe d'opération : « + » si la ligne a fait monter le solde par
// rapport à la ligne du dessus, « − » si elle l'a fait baisser, suivi du montant en
// VALEUR ABSOLUE (le rouge de la cellule indique déjà le négatif — jamais de double
// signe « − -39,73 »). Fait lire la colonne comme un calcul qui s'enchaîne de haut
// en bas. Si la ligne n'a rien changé (mouvement nul), la cellule reste vide : seules
// les lignes qui « opèrent » sur le solde s'affichent.
// Le mode détaillé des colonnes de solde, piloté par la case à cocher au-dessus du
// tableau. Par un contexte et non par une propriété : la case est lue tout en bas de
// l'arbre, dans chaque cellule de solde, et la traverser à la main obligerait à ajouter
// un booléen à cinq composants qui n'en ont que faire.
const SoldeDetaille = createContext(false);

// Le contenu d'une case de solde. La règle des quatre cas vit dans src/lib/solde-cell.ts ;
// ici on ne fait que l'habiller.
//
// En mode détaillé, chaque ligne porte sa propre couleur, et c'est tout l'intérêt :
// le mouvement est vert ou rouge selon qu'il ajoute ou retranche, le solde rouge
// seulement s'il est négatif. Ces couleurs-là écrasent celle de la cellule
// (soldeColor), qui ne sait pas distinguer les deux.
function SoldeAmount({ v, delta }: { v: number; delta?: number | null }) {
  const detaille = useContext(SoldeDetaille);
  const cell = soldeCell(v, delta, detaille);
  if (cell.kind === "empty") return null;
  if (cell.kind === "plain") return <>{fmt(cell.value)}</>;
  if (cell.kind === "operation") {
    // Les mêmes deux couleurs qu'en mode détaillé, sur une seule ligne : l'opérateur
    // dit le sens du mouvement, le montant dit le signe du solde. Ce sont deux
    // informations distinctes, et les fondre dans une couleur unique revenait à ne
    // plus pouvoir lire ni l'une ni l'autre quand toutes deux étaient rouges.
    return (
      <>
        <span className={cell.sign === "+" ? "text-foreground" : "text-tension-encre"}>{cell.sign} </span>
        <span className={cell.negative ? "text-tension-encre" : "text-foreground"}>{fmt(cell.value)}</span>
      </>
    );
  }
  return (
    <>
      {/* Le mouvement de la ligne, au-dessus et entre parenthèses : c'est ce qui a été
          ajouté ou retranché pour arriver au solde du dessous. En bloc à part plutôt
          qu'à côté — la colonne est étroite, et le mettre sur la même ligne
          l'élargirait pour tout le tableau. */}
      <span
        className={cn(
          "block text-[0.6875rem] leading-tight",
          cell.delta > 0 ? "text-foreground" : "text-tension-encre",
        )}
      >
        ({cell.delta > 0 ? "+" : "−"} {fmt(Math.abs(cell.delta))})
      </span>
      <span className={cn("block", cell.value < -0.005 ? "text-tension-encre" : "text-foreground")}>
        {fmt(cell.value)}
      </span>
    </>
  );
}

// plannedSoldeCol mais avec un détail (sidebar) et une clé de case. Non cliquable
// si la valeur est absente (cellule vide). `delta` = mouvement de la ligne, pour le
// signe d'opération (cf. SoldeAmount) ; absent = pas de signe (départ/total).
function plannedSoldeCell(
  key: string,
  val: number | null | undefined,
  border: boolean,
  detail: CellDetail | null,
  onSelect: ((d: CellDetail) => void) | undefined,
  ck: string,
  selCellKey?: ReadonlySet<string>,
  delta?: number | null,
): ColCell {
  return (
    <CellAmount
      key={key}
      className={cn(border && MONTH_GAP, "text-right tabular-nums", soldeColor(val))}
      detail={val != null ? detail : null}
      onSelect={onSelect}
      cellKey={ck}
      selCellKey={selCellKey}
    >
      {val != null ? <SoldeAmount v={val} delta={delta} /> : ""}
    </CellAmount>
  );
}

// mode : "out" (dépense), "in" (entrée) ou "total" (sous-total, montre les deux
// colonnes). La colonne Solde affiche le solde du compte cumulé, fourni par
// `solde` (une valeur par mois) ; absente ou null => cellule vide.
// detailRow : ligne de groupe (transactions/postes) permettant de construire le
// détail cliquable des cellules. Absente pour les sous-lignes (postes d'un
// récurrent) : ces cellules restent non cliquables (hors périmètre, cf. ci-dessous).
// Index du seul mois à rendre. L'Historique affiche un tableau par mois, mais les
// données restent indexées sur la frise entière : chaque composant reçoit donc
// toujours tous les mois et n'en dessine qu'un. C'est ce qui garde intactes les
// clés de case (« ligne::colonne::index de mois »), donc la sélection, les renvois
// du panneau de détail et le défilement vers une case — tout est repéré par cet
// index. Absent, tous les mois sont rendus (comportement d'origine).

function AmountCells({ cells, mode, solde, soldePrevu, soldeDepass, onSelect, subtitleOf, detailRow, months, currentMonth, rowKey, selCellKey, prevDisp, budgetEditOf, signaleDepassement, noticeOf, onboarding, onDetailOpened }: {
  cells: MonthCell[];
  mode: "out" | "in" | "total";
  solde?: (number | null)[];
  // Chaînes de solde « plan » de cette ligne (prévu / si dépassement), une valeur
  // par mois, nulles avant le mois courant. Absentes pour les sous-lignes.
  soldePrevu?: (number | null)[];
  soldeDepass?: (number | null)[];
  onSelect?: (d: CellDetail) => void;
  subtitleOf?: (i: number) => string;
  detailRow?: HistoryRow;
  months: string[];
  currentMonth: string;
  // Clé de ligne de ces cellules (group:… ou subrow:…), pour composer les data-cellkey.
  rowKey: string;
  // Case sélectionnée depuis le side panel (pour la surbrillance).
  selCellKey?: ReadonlySet<string>;
  // Clé de la dernière ligne AFFICHÉE au-dessus, par colonne de solde et par mois
  // (les cases vides à mouvement nul sont sautées) : pour surligner la bonne case
  // « Solde précédent » depuis le side panel.
  prevDisp?: { solde?: (string | undefined)[]; soldePrevu?: (string | undefined)[]; soldeDepass?: (string | undefined)[] };
  // Classe de revenu (pour les colonnes Budg./Revenus des rémunérations).
  // Ce que la case « Budget dép. » de cette ligne laisse modifier, au mois donné, ou
  // null si rien (groupe récurrent, dont le budget est la somme de ses lignes). Calculé
  // par l'appelant, seul à savoir s'il rend une enveloppe, un récurrent ou une de ses
  // lignes — voir budgetEditOfGroup / budgetEditOfLine.
  budgetEditOf?: (month: string) => BudgetEditInfo | null;
  // Y a-t-il, ce mois-là, un dépassement CHEZ cette ligne de groupe ? Vrai pour un
  // récurrent dont une ligne déborde : sa propre Balance peut être positive, mais
  // l'étiquette doit tout de même apparaître — replié, rien d'autre ne le dirait.
  signaleDepassement?: (month: string) => boolean;
  // Bandeau de dépassement de CETTE ligne au mois donné, ou null. Fourni par
  // l'appelant, seul à savoir si la ligne est une enveloppe, un récurrent ou une de ses
  // lignes — et à disposer du montant dépassé.
  noticeOf?: (month: string) => OverspendNoticeInfo | null;
  onboarding?: OnboardingTargets;
  onDetailOpened?: () => void;
}) {
  const teinteSection = useContext(TeinteSection);
  return (
    <>
      {cells.map((c, i) => {
        const type = monthType(months[i], currentMonth);
        const cols = monthColumns(type);
        const month = months[i];
        const isOnboardingBudget = detailRow?.id === onboarding?.budgetGroupId
          && i === months.indexOf(onboarding?.month ?? "");
        const isOnboardingDetail = detailRow?.id === onboarding?.detailGroupId
          && i === months.indexOf(onboarding?.month ?? "");
        const subtitle = subtitleOf?.(i);
        const r = detailRow;
        const ck = (col: Col) => cellKey(rowKey, col, i);
        // Mois où ce groupe n'a pas encore de durée de vie / n'existe plus (Task 4) :
        // les colonnes du groupe (budget, dépensé, reçu, reste) s'affichent vides —
        // rien, pas « 0,00 ». Les colonnes de solde ne sont pas concernées : elles
        // poursuivent leur propre chaîne cumulée indépendamment de ce groupe.
        const dead = r ? !ligneVivante(r.aliveMonths, i) : false;

        // CE QUI EST SORTI, CE QUI EST RENTRÉ. Les deux colonnes du réalisé montrent
        // le BRUT : un poste entièrement remboursé affichait 0,00 en Dép. alors que
        // la transaction juste en dessous montrait la somme partie (cf.
        // MonthCell.depenseBrute). Le retour se lit en face, entier, et c'est le
        // Reste qui fait la synthèse.
        const sorti = c.depenseBrute ?? c.depense;
        const rentre = c.recuBrut ?? c.recu;
        // La case d'en face — Reçu d'une dépense, Dép. d'un revenu — reste vide quand
        // rien n'y est passé, plutôt que d'afficher un 0,00 qui n'apprendrait rien.
        const contreSensVal = mode === "out" ? rentre : sorti;
        const contreSens = contreSensVal > 0.005 ? fmt(contreSensVal) : "";
        // Son calcul, quand il y a quelque chose à montrer : les transactions qui l'ont
        // fait, et la phrase qui dit où ce montant est repris.
        const contreSensDetail: CellDetail | null =
          contreSens && r
            ? makeDetail(
                mode === "out" ? "Remboursé" : "Rendu",
                txnsDuSens(r, month, mode === "out" ? "in" : "out", i) ?? [],
                {
                  subtitle,
                  result: contreSensVal,
                  note: mode === "out"
                    ? "De l'argent revenu dans ce poste. La colonne Dép. à côté montre ce qui en est vraiment sorti, sans rien déduire : c'est le Reste qui rassemble les deux, budget moins sorti plus revenu."
                    : "De l'argent ressorti de ce poste. La colonne Reçu à côté montre ce qui y est vraiment entré, sans rien déduire.",
                },
              )
            : null;

        // Dép. explique les seules SORTIES du mois, à leur montant entier : c'est ce
        // que la case montre. Une entrée garde son calcul « Rendu », qui dit en plus
        // d'où vient ce contre-sens.
        const depDetail: CellDetail | null =
          mode === "in" ? contreSensDetail
            : r ? makeDetail("Dépensé", txnsDuSens(r, month, "out", i) ?? [], { subtitle, result: sorti })
            : null;

        // Reçu, symétriquement : les seules ENTRÉES du mois. Sur une dépense, la case
        // porte le remboursement et son calcul « Remboursé ».
        const recuDetail: CellDetail | null =
          mode === "out" ? contreSensDetail
            : r ? makeDetail("Reçu", txnsDuSens(r, month, "in", i) ?? [], { subtitle, result: rentre })
            : null;

        // Reste affiche c.balance sauf pour une entrée (case vide) : cliquable même à
        // 0,00. Décomposition Budget − Dépensé quand l'invariant tient, sinon aucune.
        const resteDetail: CellDetail | null =
          mode !== "in" && r
            ? makeDetail(
                "Reste",
                Math.abs(c.budgeted - c.depense - c.balance) < 0.005
                  ? (() => {
                      // Budget − ce qui est sorti + ce qui est revenu (cf. resteParts).
                      // Trois termes et non deux : les colonnes montrent le brut, et
                      // « Budget − Dépensé » ne retomberait plus sur le Reste dès qu'un
                      // remboursement est passé. Le troisième terme ne s'affiche que
                      // s'il existe — sans retour, le calcul reste celui d'avant.
                      const p = resteParts(c);
                      return [
                        { label: "Budget", amount: p.budget, ref: ck("budget") },
                        { label: "Dépensé", amount: -p.sorti, children: txnsDuSens(r, month, "out", i)?.map(negateNode), ref: ck("depense") },
                        ...(p.rentre > 0.005
                          ? [{ label: "Remboursé", amount: p.rentre, children: txnsDuSens(r, month, "in", i), ref: ck("recu") }]
                          : []),
                      ];
                    })()
                  : [],
                { subtitle, result: c.balance },
              )
            : null;
        // Étiquette « dépassement » : une Balance négative d'un mois passé ou courant
        // (les mois à venir n'ont rien de réel). `signaleDepassement` la pose aussi sur
        // un groupe récurrent dont une ligne déborde : replié, rien d'autre ne le dirait.
        // L'étiquette et le bandeau lisent la LISTE des dépassements, pas le signe du
        // montant : c'est ce qui les fait disparaître ensemble quand on clique « Vu ».
        const enDepassement = mode === "out" && !!r && (signaleDepassement?.(month) ?? false);
        // Le bandeau suit la même liste que l'étiquette : acquitter en retire les deux.
        if (resteDetail && enDepassement) {
          resteDetail.overspendNotice = noticeOf?.(month) ?? undefined;
        }

        const s = solde?.[i];
        const net = c.recu - c.depense;
        // Solde précédent = solde de cette ligne − son propre mouvement.
        const soldeDetail: CellDetail | null =
          s != null && r
            ? makeDetail(
                "Solde",
                [
                  { label: "Solde précédent", amount: s - net, ref: prevDisp?.solde?.[i] ? cellKey(prevDisp.solde[i]!, "solde", i) : undefined },
                  // Le mouvement d'une entrée vit dans la colonne Reçu, celui d'une
                  // dépense dans Dép. — même quand le montant est encore à 0 (netCol
                  // retomberait alors sur Dép., faux pour une rémunération).
                  { label: "Mouvement du mois", amount: net, children: txnChildren(r, month, net < 0 ? -1 : 1, i), ref: ck(mode === "in" ? "recu" : mode === "out" ? "depense" : netCol(c)) },
                ],
                { subtitle, result: s },
              )
            : null;

        // --- Détails des colonnes de projection (mois courant / futurs) ---------

        // Budget rémunération (ce qui rentre) : montant de la rémunération. Principale
        // sur tous les mois où le revenu vit ; — pour une dépense. Hors de sa durée, le
        // budget d'un revenu vaut déjà 0. Clé de case « revenus ».
        const budgetRemVal: number | null = mode === "in" ? c.budgeted : null;
        const budgetRemDetail: CellDetail | null =
          budgetRemVal != null && r
            ? makeDetail("Budget rémunération", [{ label: r.name, amount: budgetRemVal, ref: ck("revenus") }], { subtitle, result: budgetRemVal })
            : null;
        // Une rémunération est une enveloppe comme une autre, en entrée : son montant
        // est daté et se modifie donc, lui aussi, dans SA case — celle-ci, puisqu'une
        // ligne d'entrée n'a pas de case « Budget dép. ». Sans ça, retirer le montant du
        // panneau du crayon aurait supprimé tout moyen de fixer un revenu.
        if (budgetRemDetail && !dead) {
          budgetRemDetail.budgetEdit = budgetEditOf?.(month) ?? undefined;
        }

        // Budget dépense (ce qui sort) : budget d'enveloppe / récurrent ; — pour une
        // entrée. Postes du récurrent si présents, sinon un nœud unique (enveloppe).
        const budgetDepVal: number | null = mode === "out" ? c.budgeted : null;
        const budgetDepDetail: CellDetail | null =
          budgetDepVal != null && r
            ? makeDetail("Budget dépense", budgetNodes(r, i) ?? [{ label: r.name, amount: c.budgeted, ref: ck("budget") }], { subtitle, result: c.budgeted })
            : null;
        // Bloc d'édition du montant sous la décomposition : c'est ici, au mois de la
        // colonne, que le budget se modifie. Sur un mois mort (la ligne n'existe pas
        // encore ou plus) il n'y a rien à fixer : la case est vide, pas à 0.
        if (budgetDepDetail && !dead) {
          budgetDepDetail.budgetEdit = budgetEditOf?.(month) ?? undefined;
        }

        // Mouvement prévu du mois de cette ligne = revenus projeté − budget (même
        // net que la chaîne « solde prévu »).
        const revenusProj = mode === "in" ? c.budgeted : 0;
        const budgetProj = mode === "out" ? c.budgeted : 0;
        const mouvementPrevu = revenusProj - budgetProj;
        // Décomposition du mouvement prévu : pour une dépense, les postes du budget
        // (négatifs) ; pour une entrée, le revenu projeté. Chaque enfant pointe vers
        // sa case, pour tracer d'où vient le montant.
        const mouvementChildren: DetailNode[] =
          mode === "out" && r
            ? (budgetNodes(r, i)?.map(negateNode) ?? [{ label: r.name, amount: -c.budgeted, ref: ck("budget") }])
            : mode === "in" && r
              ? [{ label: r.name, amount: revenusProj, ref: ck("revenus") }]
              : [];
        const sp = soldePrevu?.[i];
        const soldePrevuDetail: CellDetail | null =
          sp != null && r
            ? makeDetail(
                "Solde prévu",
                [
                  { label: "Solde précédent", amount: sp - mouvementPrevu, ref: prevDisp?.soldePrevu?.[i] ? cellKey(prevDisp.soldePrevu[i]!, "soldePrevu", i) : undefined },
                  { label: "Mouvement prévu du mois", amount: mouvementPrevu, ref: mode === "out" ? ck("budget") : mode === "in" ? ck("revenus") : undefined, children: mouvementChildren.length ? mouvementChildren : undefined },
                ],
                { subtitle, result: sp },
              )
            : null;
        const sd = soldeDepass?.[i];
        // Solde si dépassement : même décomposition en chaîne que « Solde prévu »
        // (valeur de la ligne du dessus + mouvement prévu du mois), puis on retire le
        // seul dépassement de CETTE ligne. La chaîne « si dépassement » repart de zéro
        // à chaque section (cf. computePlannedSoldes) : le « précédent » d'une ligne
        // est donc bien le « Solde si dépassement » de la ligne juste au-dessus dans sa
        // section, sans traîner les dépassements des sections du dessus.
        // Mois source du dépassement : sur un mois de projection, il vient du dépassement
        // retenu (marqué permanent) du mois courant, pas du mois affiché (dont la Balance
        // est à 0). Le montant ET le renvoi se lisent au même mois source : le chiffre
        // affiché est bien celui de la case qu'on surligne.
        const ciIdx = months.indexOf(currentMonth);
        const osSrcI = month > currentMonth && ciIdx !== -1 ? ciIdx : i;
        const ownOs = r ? rowOverspend(r, osSrcI) : 0;
        const soldeDepassDetail: CellDetail | null =
          sd != null && sp != null && r
            ? makeDetail(
                "Solde si dépassement",
                [
                  { label: "Solde précédent", amount: sd - mouvementPrevu + ownOs, ref: prevDisp?.soldeDepass?.[i] ? cellKey(prevDisp.soldeDepass[i]!, "soldeDepass", i) : undefined },
                  { label: "Mouvement prévu du mois", amount: mouvementPrevu, ref: mode === "out" ? ck("budget") : mode === "in" ? ck("revenus") : undefined, children: mouvementChildren.length ? mouvementChildren : undefined },
                  // Le dépassement propre à la ligne (sa Balance rouge), renvoi vers sa case
                  // du mois source.
                  ...(ownOs > 0.005
                    ? [{ label: "Dépassement", amount: -ownOs, ref: cellKey(rowKey, "reste", osSrcI) }]
                    : []),
                ],
                { subtitle, result: sd },
              )
            : null;

        // Colonnes réelles : cliquables (détail + surbrillance) comme avant.
        // Colonnes de projection : désormais cliquables aussi (détail + clé de case).
        const slots: ColSlots = {
          budgetRem: (b) =>
            dead ? blankCol("budgetRem", b) : (
              <CellAmount key="budgetRem" className={cn(b && MONTH_GAP, "text-right tabular-nums")} detail={budgetRemDetail} onSelect={onSelect} cellKey={ck("revenus")} selCellKey={selCellKey}>
                {budgetRemVal != null ? fmt(budgetRemVal) : ""}
              </CellAmount>
            ),
          budgetDep: (b) =>
            dead ? blankCol("budgetDep", b) : (
              <CellAmount key="budgetDep" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")} detail={budgetDepDetail} onSelect={onSelect} cellKey={ck("budget")} selCellKey={selCellKey} onboardingTarget={isOnboardingBudget ? onboarding?.budgetTarget : undefined} onboardingGroupId={isOnboardingBudget ? onboarding?.budgetGroupId : undefined} onboardingMonth={isOnboardingBudget ? onboarding?.month : undefined}>
                {budgetDepVal != null ? fmt(budgetDepVal) : ""}
              </CellAmount>
            ),
          // Les deux colonnes du réalisé montrent le BRUT : Dép. tout ce qui est sorti,
          // Reçu tout ce qui est rentré, sans rien retrancher l'une de l'autre (cf.
          // MonthCell.depenseBrute). Le Reste rassemble les deux.
          //
          // La case d'en face, celle du sens contraire, reste vide — une dépense ne
          // reçoit pas, un revenu ne dépense pas — SAUF quand de l'argent y est
          // vraiment passé à contre-sens : un remboursement encaissé sur une dépense,
          // un trop-perçu rendu sur un revenu. Il s'y affiche entier, en gris clair :
          // pas pour dire qu'il ne compte pas, mais que ce n'est pas la colonne de ce
          // poste-là — un remboursement n'est pas un revenu.
          dep: (b) =>
            dead ? blankCol("dep", b) : (
              <CellAmount key="dep" className={cn(b && MONTH_GAP, "text-right tabular-nums", mode === "in" && "text-muted-foreground")} detail={depDetail} onSelect={onSelect} cellKey={ck("depense")} selCellKey={selCellKey} onboardingTarget={isOnboardingDetail ? onboarding?.detailTarget : undefined} onboardingGroupId={isOnboardingDetail ? onboarding?.detailGroupId : undefined} onboardingMonth={isOnboardingDetail ? onboarding?.month : undefined} onOnboardingSelect={isOnboardingDetail ? onDetailOpened : undefined}>
                {mode === "in" ? contreSens : fmt(sorti)}
              </CellAmount>
            ),
          recu: (b) =>
            dead ? blankCol("recu", b) : (
              <CellAmount key="recu" className={cn(b && MONTH_GAP, "text-right tabular-nums", mode === "out" && "text-muted-foreground")} detail={recuDetail} onSelect={onSelect} cellKey={ck("recu")} selCellKey={selCellKey}>
                {mode === "out" ? contreSens : fmt(rentre)}
              </CellAmount>
            ),
          reste: (b) =>
            dead ? blankCol("reste", b) : (
              <CellAmount key="reste" className={cn(b && MONTH_GAP, "text-right tabular-nums", mode !== "in" && resteColor(c.balance))} detail={resteDetail} onSelect={onSelect} cellKey={ck("reste")} selCellKey={selCellKey}>
                {mode === "in" ? "" : (
                  <>
                    {fmt(c.balance)}
                    {/* Conteneur flex : il force le retour à la ligne sous le montant et,
                        parce qu'il ouvre un contexte de formatage indépendant, il empêche
                        le soulignement de survol de la case de déborder sur l'étiquette. */}
                    {enDepassement && (
                      <span className="mt-0.5 flex justify-end">
                        <OverspendTag />
                      </span>
                    )}
                  </>
                )}
              </CellAmount>
            ),
          soldeReel: (b) => (
            <CellAmount key="soldeReel" className={cn(b && MONTH_GAP, "text-right tabular-nums", soldeColor(s))} detail={soldeDetail} onSelect={onSelect} cellKey={ck("solde")} selCellKey={selCellKey}>
              {s != null ? <SoldeAmount v={s} delta={net} /> : ""}
            </CellAmount>
          ),
          soldePrevu: (b) => plannedSoldeCell("soldePrevu", soldePrevu?.[i] ?? null, b, soldePrevuDetail, onSelect, ck("soldePrevu"), selCellKey, mouvementPrevu),
          soldeDepass: (b) => plannedSoldeCell("soldeDepass", soldeDepass?.[i] ?? null, b, soldeDepassDetail, onSelect, ck("soldeDepass"), selCellKey, mouvementPrevu - ownOs),
        };

        return <Fragment key={i}>{renderCols(cols, slots, undefined, teinteSection)}</Fragment>;
      })}
    </>
  );
}

// Sous-total d'une section (Récurrents / Enveloppes / Non catégorisés) : rendu
// dédié, pas via AmountCells, car aucun HistoryRow unique n'y est associé. Chaque
// cellule se déplie sur la liste des groupes de la section (ou, pour les non
// catégorisés qui n'ont pas de groupes, directement leurs transactions).
// Reste : pour Récurrents/Enveloppes (sections « out » uniquement), budget − dépensé
// == balance exactement par construction (chaque ligne vérifie déjà cette égalité,
// donc leur somme aussi) : toujours cliquable. Pour les non catégorisés, budget et
// balance sont toujours à 0 : l'invariant ne tient que si dépensé == 0, donc en
// pratique non cliquable (comme documenté au Task 3 pour ce cas).
function SectionTotalsCells({ sec, accountId, months, currentMonth, onSelect, solde, planPrevu, planDepass, uncatInSec, selCellKey, prevDisp, noticeOf, total, tint, onboarding }: {
  sec: HistorySection;
  // Teinte de fond des cellules, quand elle ne découle pas de `total` : les
  // sous-totaux des deux blocs de dépenses sont des sommes sans être LE total.
  tint?: string;
  // Vraie ligne de totaux (« Total Dépenses ») et non la ligne « Non catégorisés »,
  // qui passe par le même rendu sans en être une.
  total?: boolean;
  // Le compte de la colonne : la provision des non catégorisés lui appartient.
  accountId: string;
  months: string[];
  currentMonth: string;
  onSelect?: (d: CellDetail) => void;
  solde?: (number | null)[];
  // Soldes du plan (prévu / si dépassement) au niveau de cette ligne, pour les non
  // catégorisés : ils ne sont pas planifiés, donc le solde du plan les traverse
  // (les reçus reprennent la valeur après les rémunérations, les dépenses la
  // clôture du plan).
  planPrevu?: (number | null)[];
  planDepass?: (number | null)[];
  // Section « non catégorisés » côté reçus : fournie à la section côté dépenses
  // pour calculer sa Balance (Reçu de la ligne du haut − Dépensé de celle-ci).
  uncatInSec?: HistorySection;
  selCellKey?: ReadonlySet<string>;
  // Clé de la dernière ligne AFFICHÉE au-dessus, par colonne de solde et par mois
  // (cases vides sautées) : pour surligner la bonne case « Solde précédent ».
  prevDisp?: { solde?: (string | undefined)[]; soldePrevu?: (string | undefined)[]; soldeDepass?: (string | undefined)[] };
  // Bandeau de dépassement de la section (non catégorisés) au mois donné, ou null.
  noticeOf?: (month: string) => OverspendNoticeInfo | null;
  onboarding?: OnboardingTargets;
}) {
  const isUncat = sec.kind === "uncategorized";
  // Sous-total d'un des deux blocs de dépenses. Il se lit comme une section à lui
  // seul : sa Balance et ses trois soldes disent où en est le compte une fois ce
  // bloc passé. La section entière, elle, garde ses lignes dédiées en bas.
  const isBloc = sec.kind === "expense" && !!sec.expenseBlock;
  const teinteSection = useContext(TeinteSection);
  // Section « non catégorisés » côté reçus (affichée sous les rémunérations).
  const uncatIn = isUncat && sec.uncatDirection === "in";
  const rowKey = sectionRowKey(sec);
  return (
    <>
      {sec.totals.map((c, i) => {        const type = monthType(months[i], currentMonth);
        const cols = monthColumns(type);
        const month = months[i];
        const subtitle = `${sectionLabel(sec)} · ${monthLabel(month)}`;
        const ck = (col: Col) => cellKey(rowKey, col, i);

        // Budg. affiche toujours un nombre → toujours cliquable (décomposition par
        // groupe, éventuellement vide pour les non catégorisés qui n'ont pas de budget).
        const budgetDetail: CellDetail =
          makeDetail("Budget", sec.rows.map((r) => groupNode(r, i, month, "budget")), { subtitle, result: c.budgeted });

        // Provision des non catégorisés (côté dépenses uniquement) : la case Budget
        // dép. porte le montant daté du groupe 0 en vigueur ce mois-là, éditable
        // comme le montant d'une enveloppe (voir UncatProvisionBlock).
        const provisionDetail: CellDetail = {
          title: "Non catégorisés",
          nodes: [],
          result: 0,
          uncatProvision: { accountId, month, currentAmount: c.budgeted },
        };

        const depNodes = isUncat
          ? sectionTxnChildren(sec.txns, month, true, i)
          : sec.rows.map((r) => groupNode(r, i, month, "depense")).filter((n) => n.amount !== 0);
        const depDetail: CellDetail = makeDetail("Dépensé", depNodes ?? [], { subtitle, result: c.depense });

        const recuNodes = isUncat
          ? sectionTxnChildren(sec.txns, month, false, i)
          : sec.rows.map((r) => groupNode(r, i, month, "recu")).filter((n) => n.amount !== 0);
        const recuDetail: CellDetail = makeDetail("Reçu", recuNodes ?? [], { subtitle, result: c.recu });

        // Balance des non catégorisés (côté dépenses) : le mouvement net = Reçu de
        // la ligne « Non catégorisés » du haut (reçus) − Dépensé de celle-ci.
        const inRecu = uncatInSec?.totals[i]?.recu ?? 0;
        const inRecuNodes = uncatInSec ? sectionTxnChildren(uncatInSec.txns, month, false, i) : undefined;
        // La Balance est celle que computeHistory a posée, y compris pour les non
        // catégorisés (provision + reçus sans groupe − dépensé) : la grille ne la
        // recalcule pas de son côté.
        const resteVal = c.balance;
        // Balance toujours affichée → toujours cliquable. Décomposition : Reçu (ligne
        // des reçus non catégorisés) − Dépensé pour les non catégorisés, Budget −
        // Dépensé pour les autres sections (quand l'invariant tient).
        const resteDetail: CellDetail = makeDetail(
          "Balance",
          isUncat
            ? [
                {
                  label: "Reçu",
                  amount: inRecu,
                  ref: uncatInSec ? cellKey(sectionRowKey(uncatInSec), "recu", i) : undefined,
                  children: inRecuNodes ?? undefined,
                },
                {
                  label: "Dépensé",
                  amount: -c.depense,
                  ref: ck("depense"),
                  children: (depNodes ?? []).map(negateNode),
                },
              ]
            : Math.abs(c.budgeted - c.depense - c.balance) < 0.005
              ? [
                  { label: "Budget", amount: c.budgeted, ref: ck("budget") },
                  {
                    label: "Dépensé",
                    amount: -c.depense,
                    ref: ck("depense"),
                    children: (depNodes ?? []).map(negateNode),
                  },
                ]
              : [],
          { subtitle, result: resteVal },
        );
        // Étiquette et bandeau des non catégorisés côté dépenses : même lecture de la
        // liste que partout ailleurs, pour qu'un « Vu » les retire tous les deux.
        const notice = noticeOf?.(month) ?? null;
        const enDepassement = isUncat && !uncatIn && !!notice;
        if (enDepassement) resteDetail.overspendNotice = notice;

        const s = solde?.[i];
        const net = c.recu - c.depense;
        const soldeDetail: CellDetail | null =
          s != null
            ? makeDetail(
                "Solde",
                [
                  { label: "Solde précédent", amount: s - net, ref: prevDisp?.solde?.[i] ? cellKey(prevDisp.solde[i]!, "solde", i) : undefined },
                  { label: "Mouvement du mois", amount: net, children: uncatTxnNodes(sec, month, i), ref: ck(netCol(c)) },
                ],
                { subtitle, result: s },
              )
            : null;

        // Dépassement des non catégorisés = la part rouge de leur Balance (dépensé
        // au-delà des reçus et de la provision non catégorisés). Sert au calcul du
        // solde si dépassement. Mois futur : repli sur celui du mois courant (plus de
        // report retenu — cf. computePlannedSoldes).
        const ciIdx = months.indexOf(currentMonth);
        const isFuture = month > currentMonth;
        const srcI = isFuture && ciIdx !== -1 ? ciIdx : i;
        const depassVal =
          isUncat && !uncatIn ? uncatOverspendOf(sec.totals[srcI], uncatInSec?.totals[srcI]) : 0;

        // Non catégorisés comme étape du plan : planPrevu/planDepass fournissent les
        // valeurs courues à cette ligne (le débordement net est déjà retiré de la
        // chaîne « si dépassement » — cf. computePlannedSoldes). Le détail repose le
        // calcul : valeur précédente (au-dessus) − dépassement de la ligne.
        const soldePrevuVal = planPrevu?.[i] ?? null;
        const soldeDepassVal = planDepass?.[i] ?? null;
        const soldePrevuDetail: CellDetail | null =
          isUncat && soldePrevuVal != null
            ? makeDetail(
                "Solde prévu",
                [
                  { label: "Solde précédent", amount: soldePrevuVal + c.budgeted, ref: prevDisp?.soldePrevu?.[i] ? cellKey(prevDisp.soldePrevu[i]!, "soldePrevu", i) : undefined },
                  { label: "Budget dépense", amount: -c.budgeted, ref: ck("budget") },
                ],
                { subtitle, result: soldePrevuVal },
              )
            : null;
        const soldeDepassDetail: CellDetail | null =
          isUncat && soldeDepassVal != null
            ? makeDetail(
                "Solde si dépassement",
                [
                  // Les non catégorisés récapitulent tout : ils affichent le cumul
                  // global (runD). Le détail chaîne donc sur la valeur du dessus
                  // (soldeDepassVal + depassVal = le cumul avant leur propre débordement).
                  { label: "Solde précédent", amount: soldeDepassVal + depassVal, ref: prevDisp?.soldeDepass?.[i] ? cellKey(prevDisp.soldeDepass[i]!, "soldeDepass", i) : undefined },
                  // Débordement retenu (marqué permanent) sur les mois futurs, sinon celui du
                  // mois courant. Renvoi vers la Balance du mois SOURCE (srcI) : sur un
                  // mois de projection, le débordement vient du mois courant, pas du mois
                  // affiché (dont la Balance est à 0).
                  ...(depassVal > 0.005
                    ? [{ label: "Dépassement", amount: -depassVal, ref: cellKey(rowKey, "reste", srcI) }]
                    : []),
                ],
                { subtitle, result: soldeDepassVal },
              )
            : null;

        const slots: ColSlots = {
          budgetRem: (b) => (
            <TableCell key="budgetRem" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")}></TableCell>
          ),
          // Les non catégorisés côté reçus n'ont pas de budget : « — ». Côté dépenses,
          // la case porte la provision (montant daté du groupe 0), éditable comme le
          // budget d'une enveloppe.
          budgetDep: (b) =>
            uncatIn ? (
              <TableCell key="budgetDep" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")}></TableCell>
            ) : (
              <CellAmount key="budgetDep" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")} detail={isUncat && onboarding ? budgetDetail : isUncat ? provisionDetail : budgetDetail} onSelect={onSelect} cellKey={ck("budget")} selCellKey={selCellKey}>
                {fmt(c.budgeted)}
              </CellAmount>
            ),
          dep: (b) =>
            uncatIn ? (
              <TableCell key="dep" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")}></TableCell>
            ) : (
              <CellAmount key="dep" className={cn(b && MONTH_GAP, "text-right tabular-nums")} detail={depDetail} onSelect={onSelect} cellKey={ck("depense")} selCellKey={selCellKey}>
                {fmt(c.depense)}
              </CellAmount>
            ),
          // Seuls les non catégorisés côté reçus encaissent : les sections de dépense
          // (Récurrents / Enveloppes / non catégorisés côté dépenses) affichent « — ».
          recu: (b) =>
            uncatIn ? (
              <CellAmount key="recu" className={cn(b && MONTH_GAP, "text-right tabular-nums")} detail={recuDetail} onSelect={onSelect} cellKey={ck("recu")} selCellKey={selCellKey}>
                {fmt(c.recu)}
              </CellAmount>
            ) : (
              <TableCell key="recu" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")}></TableCell>
            ),
          // Balance : affichée seulement pour les non catégorisés côté dépenses (les
          // reçus n'ont pas de budget à confronter ; Récurrents / Enveloppes ont leurs
          // lignes « Balance ... » dédiées).
          reste: (b) =>
            isBloc || (isUncat && !uncatIn) ? (
              <CellAmount key="reste" className={cn(b && MONTH_GAP, "text-right tabular-nums", resteColor(resteVal))} detail={resteDetail} onSelect={onSelect} cellKey={ck("reste")} selCellKey={selCellKey}>
                {fmt(resteVal)}
                {enDepassement && (
                  <span className="mt-0.5 flex justify-end">
                    <OverspendTag />
                  </span>
                )}
              </CellAmount>
            ) : (
              blankCol("reste", b)
            ),
          soldeReel: (b) => (
            <CellAmount key="soldeReel" className={cn(b && MONTH_GAP, "text-right tabular-nums", soldeColor(s))} detail={soldeDetail} onSelect={onSelect} cellKey={ck("solde")} selCellKey={selCellKey}>
              {s != null ? <SoldeAmount v={s} delta={net} /> : ""}
            </CellAmount>
          ),
          // Non catégorisés : on affiche le solde du plan (identique aux clôtures
          // prévues du mois) ; les autres sections de dépense restent vides. Mouvement
          // de la ligne : −budget (provision) pour le prévu, −débordement pour le si
          // dépassement (cf. les nœuds « précédent » des détails ci-dessus).
          soldePrevu: (b) =>
            isUncat
              ? plannedSoldeCell("soldePrevu", soldePrevuVal, b, soldePrevuDetail, onSelect, ck("soldePrevu"), selCellKey, -c.budgeted)
              : plannedSoldeCol("soldePrevu", null, b),
          soldeDepass: (b) =>
            isUncat
              ? plannedSoldeCell("soldeDepass", soldeDepassVal, b, soldeDepassDetail, onSelect, ck("soldeDepass"), selCellKey, -depassVal)
              : plannedSoldeCol("soldeDepass", null, b),
        };

        return <Fragment key={i}>{renderCols(cols, slots, tint ?? (total ? TOTAL_TINT : undefined), teinteSection)}</Fragment>;
      })}
    </>
  );
}

// Ligne « Total rémunérations » : somme des rémunérations principale et
// supplémentaire. Seule la colonne Reçu est renseignée (les rémunérations n'ont ni
// budget ni dépense) ; cliquable → détail dépliable jusqu'aux transactions.
function IncomeTotalCells({ sec, months, currentMonth, onSelect, selCellKey }: {
  sec: HistorySection;
  months: string[];
  currentMonth: string;
  onSelect?: (d: CellDetail) => void;
  selCellKey?: ReadonlySet<string>;
}) {
  const teinteSection = useContext(TeinteSection);
  return (
    <>
      {sec.totals.map((c, i) => {        const type = monthType(months[i], currentMonth);
        const cols = monthColumns(type);
        const month = months[i];
        const subtitle = `Revenus · ${monthLabel(month)}`;
        // Reçu toujours affiché → toujours cliquable (décomposition par rémunération).
        const recuDetail: CellDetail = makeDetail(
          "Revenus",
          sec.rows.map((r) => groupNode(r, i, month, "recu")).filter((n) => n.amount !== 0),
          { subtitle, result: c.recu },
        );
        // Budget rémunération total = somme des rémunérations affichées (principale
        // tous mois, supplémentaire au mois courant seulement), décomposé par ligne.
        const budgetRemTotal = sec.rows.reduce((s, r) => s + rowRevenus(r, i), 0);
        const budgetRemNodes = sec.rows
          .map((r): DetailNode => ({ label: r.name, amount: rowRevenus(r, i), ref: cellKey(groupRow(r.id), "revenus", i) }))
          .filter((n) => n.amount !== 0);
        const budgetRemDetail: CellDetail = makeDetail("Budget rémunération", budgetRemNodes, { subtitle, result: budgetRemTotal });

        const slots: ColSlots = {
          budgetRem: (b) => (
            <CellAmount key="budgetRem" className={cn(b && MONTH_GAP, "text-right tabular-nums")} detail={budgetRemDetail} onSelect={onSelect} cellKey={cellKey(sectionRow("income"), "revenus", i)} selCellKey={selCellKey}>
              {fmt(budgetRemTotal)}
            </CellAmount>
          ),
          budgetDep: (b) => (
            <TableCell key="budgetDep" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")}></TableCell>
          ),
          dep: (b) => (
            <TableCell key="dep" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")}></TableCell>
          ),
          recu: (b) => (
            <CellAmount key="recu" className={cn(b && MONTH_GAP, "text-right tabular-nums")} detail={recuDetail} onSelect={onSelect} cellKey={cellKey(sectionRow("income"), "recu", i)} selCellKey={selCellKey}>
              {fmt(c.recu)}
            </CellAmount>
          ),
          reste: (b) => blankCol("reste", b),
          soldeReel: (b) => blankCol("soldeReel", b),
          soldePrevu: (b) => blankCol("soldePrevu", b),
          soldeDepass: (b) => blankCol("soldeDepass", b),
        };

        // Dans une section teintée, le fond ne couvre que les colonnes de données :
        // Balance et Solde gardent leur ambre et leur bleu jusque sur les totaux.
        return <Fragment key={i}>{renderCols(cols, slots, teinteSection ? undefined : TOTAL_TINT, teinteSection)}</Fragment>;
      })}
    </>
  );
}

// Ligne « Total » (grand total du tableau) : rendu dédié, pas via AmountCells. Budg./
// Dép./Reçu se déplient sur la liste des sections (elles-mêmes dépliables sur leurs
// groupes, puis leurs transactions) ; Solde = Argent de départ + chaque section.
// Reste : cliquable seulement si l'invariant budget − dépensé == balance tient
// (souvent faux au global : la section Rémunérations a un budget mais pas de
// dépense, donc généralement non cliquable — ce qui est acceptable, cf. brief).
// Le pied du tableau se lit en deux lignes, et pas en une.
//
// Une seule ligne faisait deux métiers à la fois : à gauche elle totalisait le mois
// (budget, dépensé, balance), à droite elle donnait le solde de fin de mois, qui
// n'est pas un total mais un aboutissement. « part » sépare les deux : « totaux »
// rend tout sauf les trois soldes, « soldes » ne rend qu'eux.
//
// Les clés de case (data-cellkey) ne bougent pas d'un pouce : elles ne dépendent que
// de la ligne logique, pas du <tr> qui la porte. Tous les renvois du panneau de
// détail vers « Solde de fin du mois précédent » continuent donc de viser juste.
type PartDuPied = "totaux" | "soldes";
const COLONNES_DE_SOLDE: ColKey[] = ["soldeReel", "soldePrevu", "soldeDepass"];

function GrandTotalsCells({ sections, grand, solde, planned, months, currentMonth, currentEstimate, onSelect, selCellKey, part }: {
  part: PartDuPied;
  sections: HistorySection[];
  grand: MonthCell[];
  solde: SoldeColumn;
  planned: PlannedSoldes;
  months: string[];
  currentMonth: string;
  // Estimé de fin du mois courant : point de départ des chaînes de plan du premier
  // mois futur (cf. computePlannedSoldes).
  currentEstimate?: number;
  onSelect?: (d: CellDetail) => void;
  selCellKey?: ReadonlySet<string>;
}) {
  return (
    <>
      {grand.map((c, i) => {        const type = monthType(months[i], currentMonth);
        const cols = monthColumns(type);
        const month = months[i];
        const subtitle = monthLabel(month);
        const ck = (col: Col) => cellKey("grand", col, i);
        // Budget rémunération total = somme des rémunérations affichées (principale
        // tous mois, supplémentaire au mois courant seulement).
        const allRows = sections.flatMap((s) => s.rows);
        const budgetRemTotal = allRows.reduce((a, r) => a + rowRevenus(r, i), 0);

        // Budget des dépenses seulement (enveloppes + récurrents, hors rémunérations).
        const expenseBudget = sections.reduce((s, sec) => s + (sec.kind === "income" ? 0 : sec.totals[i].budgeted), 0);

        // Dép./Reçu/Reste du grand total : toujours un nombre affiché → toujours
        // cliquables (décomposition par section, éventuellement vide).
        const depDetail: CellDetail = makeDetail(
          "Dépensé",
          sections.map((sec) => sectionNode(sec, i, month, "depense")).filter((n) => n.amount !== 0),
          { subtitle, result: c.depense },
        );
        const recuDetail: CellDetail = makeDetail(
          "Reçu",
          sections.map((sec) => sectionNode(sec, i, month, "recu")).filter((n) => n.amount !== 0),
          { subtitle, result: c.recu },
        );
        // Reste : non affiché sur la ligne « Total » (grand total) — un reste
        // agrégé toutes catégories confondues n'est pas parlant.
        const soldeDetail: CellDetail = soldeActuelDetail(sections, solde, i, month, { title: "Solde fin de mois", result: solde.closings[i] });

        // --- Détails des colonnes de projection du grand total ------------------
        // Budget de projection : seules les sections de dépense (cohérent avec la
        // valeur affichée expenseBudget, qui exclut les rémunérations). On écarte les
        // nœuds à zéro comme pour « Dépensé » / « Reçu » : sinon les deux sections
        // « Non catégorisés » (reçus, sans budget, et dépenses sans provision)
        // apparaissent en double à 0,00.
        const expenseBudgetDetail: CellDetail =
          makeDetail("Budget", sections.filter((sec) => sec.kind !== "income").map((sec) => sectionNode(sec, i, month, "budget")).filter((n) => n.amount !== 0), { subtitle, result: expenseBudget });
        // Détail du budget rémunération : un nœud par rémunération affichée.
        const budgetRemNodes = allRows
          .filter((r) => r.direction === "in")
          .map((r): DetailNode => ({ label: r.name, amount: rowRevenus(r, i), ref: cellKey(groupRow(r.id), "revenus", i) }))
          .filter((n) => n.amount !== 0);
        const budgetRemDetail: CellDetail = makeDetail("Budget rémunération", budgetRemNodes, { subtitle, result: budgetRemTotal });
        // Mois de référence des dépassements maintenus (mois courant en projection).
        const ciIdx = months.indexOf(currentMonth);
        const cs = month <= currentMonth || ciIdx === -1 ? i : ciIdx;
        // Soldes de plan (prévu / si dépassement) : structure « précédent + mouvement ».
        // Le « précédent » = l'ouverture réelle du mois (passé / courant, où le plan
        // s'ancre), ou la clôture prévue du mois passé (futur). Le mouvement =
        // clôture − précédent (exact par défaut).
        const prevuClose = planned.prevuClosings[i];
        const depassClose = planned.depassClosings[i];
        // Premier mois futur : la chaîne du plan repart de l'estimé de fin du mois courant.
        const firstFuture = month > currentMonth && i > 0 && months[i - 1] === currentMonth;
        const prevuPrev =
          month <= currentMonth ? solde.openings[i]
          : firstFuture && currentEstimate != null ? currentEstimate
          : i > 0 && planned.prevuClosings[i - 1] != null ? planned.prevuClosings[i - 1]! : solde.openings[i];
        // Décomposition du mouvement prévu du mois = revenus prévus − budget de dépenses.
        const revenusChildren = allRows
          .filter((r) => r.direction === "in")
          .map((r): DetailNode => ({ label: r.name, amount: rowRevenus(r, i), ref: cellKey(groupRow(r.id), "revenus", i) }))
          .filter((n) => n.amount !== 0);
        const budgetChildren = sections
          .filter((sec) => sec.kind !== "income")
          .map((sec) => negateNode(sectionNode(sec, i, month, "budget")))
          .filter((n) => n.amount !== 0);
        const mouvementPrevuNode: DetailNode = {
          label: "Mouvement prévu du mois",
          amount: prevuClose != null ? prevuClose - prevuPrev : 0,
          children: [
            { label: "Revenus prévus", amount: budgetRemTotal, ref: ck("revenus"), children: revenusChildren },
            { label: "Budget", amount: -expenseBudget, ref: ck("budget"), children: budgetChildren },
          ],
        };
        const soldePrevuDetail: CellDetail | null =
          prevuClose != null
            ? makeDetail(
                "Solde prévu",
                [
                  {
                    label: firstFuture ? "Estimé fin du mois précédent" : "Solde précédent",
                    amount: prevuPrev,
                    ref:
                      month <= currentMonth ? cellKey(openingRow, "soldePrevu", i)
                      : firstFuture ? cellKey("estime", "solde", i - 1)
                      : cellKey("grand", "soldePrevu", i - 1),
                  },
                  mouvementPrevuNode,
                ],
                { subtitle, result: prevuClose },
              )
            : null;
        // Dépassement cumulé du grand total = dépassement total maintenu, décomposé
        // par groupe. Mois passés/courant : montants réels du mois affiché. Mois
        // futurs : repli sur ceux du mois courant (cf. cs ; plus de report retenu —
        // cf. computePlannedSoldes). Les renvois pointent toujours vers les cases
        // Balance du mois affiché : la surbrillance reste dans la colonne du mois cliqué.
        const uncatOs = uncatOverspend(sections, cs);
        const overspendRows: { id: number; name: string; amount: number }[] = allRows
          .filter((r) => r.direction === "out" && r.cells[cs].balance < 0)
          .map((r) => ({ id: r.id, name: r.name, amount: r.cells[cs].balance }));
        const grandOverspendChildren: DetailNode[] = [
          ...overspendRows.map((r): DetailNode => ({ label: r.name, amount: r.amount, ref: cellKey(groupRow(r.id), "reste", i) })),
          // Débordement net des non catégorisés (dépensé au-delà des reçus), inclus
          // dans la chaîne « si dépassement » comme les dépassements de budget.
          ...(uncatOs > 0.005
            ? [{ label: "Non catégorisés", amount: -uncatOs, ref: cellKey(sectionRow("uncategorized"), "reste", i) }]
            : []),
        ];
        const soldeDepassDetail: CellDetail | null =
          depassClose != null && prevuClose != null
            ? makeDetail(
                "Solde si dépassement",
                [
                  { label: "Solde prévu", amount: prevuClose, ref: ck("soldePrevu") },
                  // La somme n'existe pas telle quelle : surligner ensemble les cases
                  // Balance rouges qui la composent.
                  {
                    label: "Dépassement cumulé",
                    amount: -(prevuClose - depassClose),
                    refs: grandOverspendChildren.map((n) => n.ref!).filter(Boolean),
                    children: grandOverspendChildren,
                  },
                ],
                { subtitle, result: depassClose },
              )
            : null;

        const slots: ColSlots = {
          budgetRem: (b) => (
            <CellAmount key="budgetRem" className={cn(b && MONTH_GAP, "text-right tabular-nums")} detail={budgetRemDetail} onSelect={onSelect} cellKey={ck("revenus")} selCellKey={selCellKey}>
              {fmt(budgetRemTotal)}
            </CellAmount>
          ),
          budgetDep: (b) => (
            <CellAmount key="budgetDep" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")} detail={expenseBudgetDetail} onSelect={onSelect} cellKey={ck("budget")} selCellKey={selCellKey}>
              {fmt(expenseBudget)}
            </CellAmount>
          ),
          dep: (b) => (
            <CellAmount key="dep" className={cn(b && MONTH_GAP, "text-right tabular-nums")} detail={depDetail} onSelect={onSelect} cellKey={ck("depense")} selCellKey={selCellKey}>
              {fmt(c.depense)}
            </CellAmount>
          ),
          recu: (b) => (
            <CellAmount key="recu" className={cn(b && MONTH_GAP, "text-right tabular-nums")} detail={recuDetail} onSelect={onSelect} cellKey={ck("recu")} selCellKey={selCellKey}>
              {fmt(c.recu)}
            </CellAmount>
          ),
          reste: (b) => blankCol("reste", b),
          soldeReel: (b) => (
            <CellAmount key="soldeReel" className={cn(b && MONTH_GAP, "text-right tabular-nums", soldeColor(solde.closings[i]))} detail={soldeDetail} onSelect={onSelect} cellKey={ck("solde")} selCellKey={selCellKey}>
              {fmt(solde.closings[i])}
            </CellAmount>
          ),
          soldePrevu: (b) => plannedSoldeCell("soldePrevu", planned.prevuClosings[i], b, soldePrevuDetail, onSelect, ck("soldePrevu"), selCellKey),
          soldeDepass: (b) => plannedSoldeCell("soldeDepass", planned.depassClosings[i], b, soldeDepassDetail, onSelect, ck("soldeDepass"), selCellKey),
        };

        // Chaque moitié vide les colonnes de l'autre : les deux lignes se
        // superposent exactement, et rien n'est écrit deux fois.
        const vides = blankSlots();
        for (const col of cols) {
          const estSolde = COLONNES_DE_SOLDE.includes(col);
          if (estSolde === (part === "soldes")) continue;
          slots[col] = vides[col];
        }
        // Le gris du grand total ne couvre que les colonnes de données : Balance et
        // Solde gardent leur densité propre jusqu'en bas du tableau.
        return <Fragment key={i}>{renderCols(cols, slots, undefined, TOTAL_TINT)}</Fragment>;
      })}
    </>
  );
}

// Cellules d'une transaction : son montant tombe dans la colonne Dép. (sortie)
// ou Reçu (entrée) du mois où elle a lieu ; le reste est vide.
//
// C'est le SIGNE qui décide de la colonne, jamais le poste qui porte la ligne. Un
// remboursement rangé dans une dépense s'affiche donc dans Reçu, à son montant
// entier : c'est de l'argent qui est bel et bien rentré, et on veut le voir tel
// quel. Ce qu'il pèse dans son poste est une autre affaire, et elle se lit une
// ligne plus haut — le Dépensé du poste est déjà net de ce remboursement.
function TxnCells({ txn, months, currentMonth, onSelect, selCellKey }: { txn: HistoryTxn; months: string[]; currentMonth: string; onSelect?: (d: CellDetail) => void; selCellKey?: ReadonlySet<string> }) {
  const isOut = txn.amount < 0;
  const montant = Math.abs(txn.amount);
  const teinteSection = useContext(TeinteSection);
  return (
    <>
      {months.map((m, i) => {
        const cols = monthColumns(monthType(m, currentMonth));
        const here = txn.month === m;
        const val = here ? fmt(montant) : "";
        // La transaction n'occupe qu'une case. En mois de projection, ni Dép. ni Reçu
        // n'existent : la ligne reste vide.
        const ck = here ? cellKey(txnRow(txn.id), isOut ? "depense" : "recu", i) : undefined;
        // Détail minimal d'une transaction : une seule feuille (elle-même), pour que
        // sa case chiffrée soit cliquable comme les montants agrégés.
        const detail: CellDetail | null = here
          ? makeDetail(
              "Transaction",
              [{ label: `${txn.date} · ${txn.label}`, amount: montant }],
              { subtitle: monthLabel(m), result: montant },
            )
          : null;
        const slots: ColSlots = {
          budgetRem: (b) => blankCol("budgetRem", b),
          budgetDep: (b) => blankCol("budgetDep", b),
          dep: (b) =>
            here && isOut ? (
              <CellAmount key="dep" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")} detail={detail} onSelect={onSelect} cellKey={ck} selCellKey={selCellKey}>
                {val}
              </CellAmount>
            ) : (
              <TableCell key="dep" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")} />
            ),
          recu: (b) =>
            here && !isOut ? (
              <CellAmount key="recu" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")} detail={detail} onSelect={onSelect} cellKey={ck} selCellKey={selCellKey}>
                {val}
              </CellAmount>
            ) : (
              <TableCell key="recu" className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")} />
            ),
          reste: (b) => blankCol("reste", b),
          soldeReel: (b) => blankCol("soldeReel", b),
          soldePrevu: (b) => blankCol("soldePrevu", b),
          soldeDepass: (b) => blankCol("soldeDepass", b),
        };
        return <Fragment key={i}>{renderCols(cols, slots, undefined, teinteSection)}</Fragment>;
      })}
    </>
  );
}

// Cellule gauche (sticky) d'une ligne, avec retrait et chevron optionnel.
// Plus de prop `bg` : elle ne servait qu'à porter les teintes de bloc et de bande,
// que le tableau n'a plus. La cellule prend le fond de la page comme les autres.
function NameCell({ children, indent, expandable, expanded, onToggle }: {
  children: React.ReactNode;
  indent: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  // La colonne du nom prend la teinte de sa section, sans quoi la couleur
  // commencerait au premier chiffre et la ligne paraîtrait coupée en deux.
  const teinteSection = useContext(TeinteSection);
  return (
    <TableCell
      className={cn(teinteSection ?? "bg-background", COL1_STICKY, "h-px p-0", expandable && "cursor-pointer")}
      onClick={onToggle}
    >
      <FirstColBox indent={indent}>
        {expandable ? (
          expanded ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />
        ) : (
          <span className="inline-block size-4 shrink-0" />
        )}
        {children}
      </FirstColBox>
    </TableCell>
  );
}

// Ligne de transaction : « date · libellé » puis, en dessous, le menu de
// (ré)assignation de groupe. Le montant tombe dans la colonne de son mois.
function TxnRow({ txn, months, currentMonth, groups, indent, onSelect, selCellKey, ignored = false, demo = false }: {
  txn: HistoryTxn;
  months: string[];
  currentMonth: string;
  groups: SelectGroup[];
  indent: number;
  onSelect?: (d: CellDetail) => void;
  selCellKey?: ReadonlySet<string>;
  // Vrai dans la section « Non comptabilisées ». On y remplace le menu de
  // rattachement — sans effet tant que la transaction est hors calcul — par le
  // bouton de retour dans les calculs, avec son libellé puisque la place est libre.
  ignored?: boolean;
  demo?: boolean;
}) {
  return (
    <TableRow className="align-top text-sm text-muted-foreground">
      <TableCell className={cn(COL1_STICKY, "bg-background h-px p-0")}>
        <div
          className={cn("border-border/60 flex h-full flex-col gap-1 border-r py-2 pr-2 font-sans", COL1_W)}
          style={{ paddingLeft: `${0.5 + indent * 1.25}rem` }}
        >
          {/* La date au-dessus, le libellé en dessous : côte à côte, la date mangeait
              un tiers de la colonne et coupait presque tous les libellés. Empilés, le
              libellé dispose de toute la largeur et déborde bien plus rarement. */}
          <div className="group/txn flex flex-col gap-0.5 overflow-hidden">
            {/* La date reste en chasse fixe : c'est une donnée, elle s'aligne
                d'une ligne à l'autre comme les montants. */}
            <span className="text-ardoise-claire text-xs tabular-nums">{txn.date}</span>
            <TruncatedText text={txn.label} className="leading-5" lines={2} />
            {/* Le commentaire vient juste sous le libellé, dans la même colonne. */}
            {!demo && <TxnCommentField txnId={txn.id} comment={txn.comment} />}
          </div>
          {demo ? (
            <span className="text-ardoise-claire text-xs">Disponible avec vos données</span>
          ) : ignored ? (
            <IgnoreTxnToggle txnId={txn.id} ignored withLabel />
          ) : (
            <div className="flex min-w-0 items-center gap-1">
              {/* Seuls les groupes qui vivent le mois de CETTE transaction. */}
              <GroupSelectField
                txnId={txn.id}
                groups={groupsForMonth(groups, txn.month, txn.groupId)}
                defaultGroupId={txn.groupId}
                defaultLineId={txn.lineId}
                className="min-w-0 flex-1"
              />
              <IgnoreTxnToggle txnId={txn.id} ignored={false} size="icon-sm" />
            </div>
          )}
        </div>
      </TableCell>
      <TxnCells txn={txn} months={months} currentMonth={currentMonth} onSelect={onSelect} selCellKey={selCellKey} />
    </TableRow>
  );
}

// Ligne d'espacement entre deux sections : une bande vide de faible hauteur qui
// couvre toutes les colonnes, pour aérer visuellement sans ajouter de contenu.
function SpacerRow({ cols }: { cols: number }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={cols} className="h-2 border-0 p-0" />
    </TableRow>
  );
}

// Premier ancêtre réellement défilant sur un axe (x = horizontal, y = vertical).
// Sert à amener une case dans la vue sans scrollIntoView (qui ne tient pas compte
// de la colonne collante et défile parfois le mauvais conteneur).
function scrollableAncestor(el: HTMLElement, axis: "x" | "y"): HTMLElement | null {
  let node = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    const overflow = axis === "x" ? style.overflowX : style.overflowY;
    const scrollable =
      axis === "x" ? node.scrollWidth > node.clientWidth : node.scrollHeight > node.clientHeight;
    if ((overflow === "auto" || overflow === "scroll") && scrollable) return node;
    node = node.parentElement;
  }
  return null;
}

type OnboardingTargets = {
  budgetGroupId: number;
  detailGroupId: number;
  month: string;
  timeTarget: string;
  incomeTarget: string;
  expensesTarget: string;
  budgetTarget: string;
  detailTarget: string;
  endingBalanceTarget: string;
};

export function HistoryGrid({ months, currentMonth, stripMin, stripMax, forecast, sections, ignoredBlocks, overspend, grand, groups, solde, planned, onSelect, selected, anchor, accountId, overspendsByMonth, showDeltas, onboarding, onDetailOpened }: {
  months: string[];
  currentMonth: string;
  // Bornes de la frise : les mois que le calendrier du formulaire de création
  // inline d'un groupe accepte, passé compris.
  stripMin: string;
  stripMax: string;
  // Mode détaillé des colonnes de solde : la case à cocher vit au-dessus du tableau,
  // hors du défilement horizontal, donc son état arrive d'au-dessus (cf. SoldeDetaille).
  showDeltas?: boolean;
  forecast: AccountForecast;
  sections: HistorySection[];
  // Transactions mises hors calcul par l'utilisateur, reçus puis dépenses. Rendues
  // tout en bas, à l'écart des sections : aucun total ne les additionne.
  ignoredBlocks?: IgnoredBlock[];
  overspend: number[];
  grand: MonthCell[];
  groups: SelectGroup[];
  solde: SoldeColumn;
  planned: PlannedSoldes;
  // Clic sur un montant : remonté au parent, qui l'affiche dans la sidebar.
  onSelect: (d: CellDetail) => void;
  // Cases actives choisies depuis le side panel (clés data-cellkey, null = aucune).
  // Plusieurs quand la ligne cliquée du panneau est une somme éclatée dans le tableau.
  selected?: string[] | null;
  // Case ancre = montant cliqué dans le tableau ; reste surligné tant que le panneau
  // est ouvert, en plus de la case active.
  anchor?: string | null;
  // Compte affiché : nécessaire au bloc de décision d'un dépassement (Task 6).
  accountId: string;
  // Décisions déjà prises sur des dépassements (groupId, mois), chargées en page.
  // Dépassements groupés par mois : l'étiquette « dépassement » sur les cases, et le
  // signal porté par un groupe récurrent dont une ligne déborde.
  overspendsByMonth?: Record<string, Overspend[]>;
  onboarding?: OnboardingTargets;
  onDetailOpened?: () => void;
}) {
  const demo = onboarding !== undefined;
  // Groupes qui ont un dépassement, par mois (clé « groupe::mois ») : un récurrent
  // replié doit le montrer sur sa propre case, faute de voir ses lignes.
  const groupeEnDepassement = useMemo(() => groupsWithPending(overspendsByMonth ?? {}), [overspendsByMonth]);
  // Le dépassement d'une case précise, pour son bandeau. La clé porte la ligne : une
  // enveloppe et une ligne de récurrent ne se confondent pas.
  const depassementDeCase = useMemo(() => {
    const m = new Map<string, Overspend>();
    for (const [mois, items] of Object.entries(overspendsByMonth ?? {})) {
      for (const it of items) m.set(`${it.groupId}::${it.lineId ?? 0}::${mois}`, it);
    }
    return m;
  }, [overspendsByMonth]);
  const noticeDe = (groupId: number, lineId: number | null) => (mois: string): OverspendNoticeInfo | null => {
    const o = depassementDeCase.get(`${groupId}::${lineId ?? 0}::${mois}`);
    if (!o || !accountId || demo) return null;
    return { id: notificationId(accountId, o.groupId, o.lineId, mois), name: o.name, month: mois, amount: o.amount };
  };
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  // Section dont le formulaire de création inline est ouvert, ou null si aucun
  // (Task 5). Un seul formulaire ouvert à la fois, et c'est le même formulaire des
  // deux côtés : seul le sens change.
  // Le mois en fait partie : chaque tableau de mois porte ses propres boutons
  // d'ajout, et sans lui le même formulaire s'ouvrirait dans tous les mois à la fois.
  // « line » porte en plus la dépense qu'on découpe : son formulaire ne s'ouvre pas
  // sous un titre de section mais sous la ligne du groupe visé, là où on l'a demandé.
  type Adding =
    | { kind: "expense"; month: string }
    | { kind: "income"; month: string }
    | { kind: "line"; groupId: number; month: string };
  const [adding, setAdding] = useState<Adding | null>(null);
  // Ouvre le formulaire de cette section dans CE tableau, ou le referme si c'est
  // déjà lui qui est ouvert.
  const toggleAdding = (kind: "expense" | "income", month: string) =>
    setAdding((prev) =>
      prev && prev.kind === kind && prev.month === month
        ? null
        : { kind, month },
    );
  // Le formulaire ouvert dans ce tableau-ci, ou null : le même état sert les N mois.
  const addingHere = (month: string) => (adding?.month === month ? adding.kind : null);
  // La section « Ce qui sort » se replie d'un seul geste. Les dépenses conservent
  // leur nature en base, mais l'écran ne les sépare plus en deux blocs.
  const [depensesRepliees, setDepensesRepliees] = useState(false);
  // Idem pour un sous-poste, mais la question porte sur une dépense précise.
  const addingLineHere = (groupId: number, month: string) =>
    adding?.kind === "line" && adding.groupId === groupId && adding.month === month;
  const toggleAddingLine = (groupId: number, month: string) =>
    setAdding((prev) =>
      prev?.kind === "line" && prev.groupId === groupId && prev.month === month
        ? null
        : { kind: "line", groupId, month },
    );

  // Case active (B) choisie dans le panneau : sert au défilement et à la révélation.
  // S'il y en a plusieurs (somme), on défile vers la première.
  const activeCell = selected?.[0] ?? null;
  // Cases à surligner dans le tableau : l'ancre (A, le montant cliqué dans le tableau,
  // qui reste sélectionné tant que le panneau est ouvert) ET les cases actives (B).
  const selCellKey = useMemo(() => highlightedCells(anchor ?? null, selected ?? null), [anchor, selected]);
  // Ligne porteuse de la case active : préfixe de la clé « <ligne>::col::mois »
  // (ex. txn:<id>, subrow:<id>). Sert à retrouver les dépliages qui la révèlent.
  const selRowKey = rowKeyOf(activeCell);
  // Conteneur du tableau (display:contents) : sert à repérer, par data-cellkey, la
  // case sélectionnée pour la faire défiler dans la vue — sans être lui-même un
  // conteneur de mise en page.
  const gridRef = useRef<HTMLDivElement>(null);

  // Quels dépliages ouvrir pour révéler une ligne masquée choisie dans le panneau
  // (cf. src/lib/history-nav.ts).
  const revealOpenKeys = useMemo(() => computeRevealKeys(sections), [sections]);

  // Vers quelle case renvoie le « Solde précédent » de chaque ligne, colonne par
  // colonne (cf. src/lib/history-nav.ts).
  const prevDisplayedByCol = useMemo(
    () => computePrevDisplayed(sections, months, currentMonth, solde, planned),
    [sections, months, currentMonth, solde, planned],
  );

  // Estimé de fin du mois courant, aligné sur le tableau : le Total + les
  // rémunérations restant à recevoir − les Balances vertes non nulles (le budget
  // restant, qu'on suppose dépensé d'ici la fin du mois).
  const tableEstimate = useMemo(
    () => computeTableEstimate(sections, months, currentMonth, forecast.balance),
    [sections, months, currentMonth, forecast.balance],
  );
  const estimateValue = tableEstimate?.value ?? forecast.currentEstimate;

  // Dépliage effectif = dépliage utilisateur, plus les ancêtres de la ligne
  // sélectionnée (transaction ou sous-ligne, pour la révéler sans muter l'état de
  // dépliage manuel). Dérivé plutôt que posé dans un effet : pas de setState en cascade.
  const effectiveOpen = useMemo(
    () => withRevealed(open, selRowKey, revealOpenKeys, PARTOUT),
    [open, selRowKey, revealOpenKeys],
  );
  // Un dépliage ne porte plus de mois. Il n'y a qu'UN tableau, donc une ligne n'y
  // existe qu'une fois : la déplier la déplie pour tous les mois affichés à la fois,
  // et c'est la seule chose que le lecteur puisse attendre. Le jeton reste dans la
  // clé pour que les clés fabriquées ici et celles de la révélation depuis le
  // panneau restent les mêmes chaînes.
  const isOpen = (k: string) => effectiveOpen.has(openKeyIn(k, PARTOUT));
  const toggleIn = (k: string) => toggle(openKeyIn(k, PARTOUT));

  // Le mois où atterrit ce qu'on crée depuis ce tableau. Les boutons de création ne
  // vivent plus dans un tableau de mois, ils vivent une fois pour toutes dans la
  // colonne de gauche : il faut donc leur désigner un mois. Le mois courant quand il
  // est à l'écran — c'est celui qu'on a sous les yeux et celui où l'on dépense —,
  // sinon le premier mois affiché.
  const moisDeTravail = months.includes(currentMonth) ? currentMonth : months[0];

  // Nombre total de colonnes du tableau (Catégorie + les colonnes de chaque mois),
  // pour l'attribut colSpan des lignes d'espacement et des formulaires en ligne.
  const totalCols = 1 + months.reduce((n, m) => n + monthColumns(monthType(m, currentMonth)).length, 0);

  // Faire défiler la case sélectionnée dans la vue (après dépliage éventuel : la
  // dépendance sur effectiveOpen relance l'effet une fois la ligne montée). On
  // défile explicitement le conteneur horizontal (CenterScroll) et le conteneur
  // vertical, plutôt que scrollIntoView, pour tenir compte de la première colonne
  // collante (sinon la case reste cachée derrière) et défiler le bon conteneur.
  useEffect(() => {
    if (!activeCell) return;
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-cellkey="${activeCell}"]`);
    if (!el) return;
    const pad = 12;

    // Horizontal : révéler la case à droite de la colonne collante de gauche.
    const hx = scrollableAncestor(el, "x");
    if (hx) {
      const cRect = hx.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      const sticky = hx.querySelector<HTMLElement>("thead th.sticky, tbody td.sticky");
      const stickyW = sticky ? sticky.getBoundingClientRect().width : 0;
      const visLeft = cRect.left + stickyW;
      // behavior "auto" (instantané) : le défilement "smooth" est ignoré sur ce
      // conteneur (colonne collante), la case n'était alors jamais révélée.
      if (eRect.left < visLeft) hx.scrollBy({ left: eRect.left - visLeft - pad, behavior: "auto" });
      else if (eRect.right > cRect.right) hx.scrollBy({ left: eRect.right - cRect.right + pad, behavior: "auto" });
    }

    // Vertical : révéler la ligne dans le conteneur qui défile en hauteur.
    const vy = scrollableAncestor(el, "y");
    if (vy) {
      const cRect = vy.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      if (eRect.top < cRect.top) vy.scrollBy({ top: eRect.top - cRect.top - pad, behavior: "auto" });
      else if (eRect.bottom > cRect.bottom) vy.scrollBy({ top: eRect.bottom - cRect.bottom + pad, behavior: "auto" });
    }
  }, [activeCell, effectiveOpen]);

  // topLevel : ligne au niveau des sections (rémunérations), bande grise comme
  // les en-têtes Récurrents / Enveloppes.
  const renderGroup = (r: HistoryRow, topLevel = false) => {
    const gKey = rowOpenKey(r.id);
    const selfKey = groupRow(r.id);
    const hasChildren = r.subRows.length > 0 || r.txns.length > 0;
    const gOpen = isOpen(gKey);
    // Détail « gestion du groupe » ouvert par l'icône au survol. Le mois visé est
    // celui du tableau où on a cliqué : c'est là que prendra effet le montant de
    // départ d'une ligne ajoutée, et c'est le mois qu'on avait sous les yeux.
    // Nature et lignes viennent du SelectGroup enrichi (pas de requête
    // supplémentaire), réduites à ce qui ne dépend pas du mois : les montants ne se
    // modifient plus ici mais dans leur case (cf. BudgetEditBlock).
    const sg = groups.find((g) => g.id === r.id);
    const manageMonth = moisDeTravail;
    const manageDetail: CellDetail = {
      title: r.name,
      nodes: [],
      result: 0,
      groupManage: {
        groupId: r.id,
        name: r.name,
        month: manageMonth,
        stripMin,
        stripMax,
        startMonth: sg?.startMonth,
        endMonth: sg?.endMonth,
        changes: sg?.changes ?? [],
        lines: (sg?.lines ?? []).map((l) => ({ id: l.id, name: l.name })),
        // Seules les dépenses ont un bloc : un revenu part sans, et le panneau ne lui
        // propose alors rien à déplacer.
        planned: r.direction === "out" ? r.planned !== false : undefined,
      },
    };
    return (
      <Fragment key={r.id}>
        <TableRow className={cn("group", topLevel ? "font-medium" : hasChildren && "hover:bg-muted/50")}>
          <NameCell indent={0} expandable={hasChildren} expanded={gOpen} onToggle={hasChildren ? () => toggleIn(gKey) : undefined}>
            {r.direction === "in" ? (
              <ArrowUpRight className="text-portant hidden size-4 shrink-0 sm:block" />
            ) : (
              <ArrowDownRight className="text-tension-encre hidden size-4 shrink-0 sm:block" />
            )}
            {/* Le nom et la durée côte à côte quand la colonne est large, empilés
                quand elle ne fait plus que 176 px : à cette largeur, deux textes sur
                la même ligne se coupent tous les deux. Empilés, ils se lisent en
                entier, et rien ne disparaît. */}
            <span className="flex min-w-0 flex-col">
            <span className="min-w-0 font-medium break-words whitespace-normal [hyphens:auto] sm:truncate sm:[hyphens:none]">{r.name}</span>
            {/* Durée de vie du groupe, dite en clair : « depuis toujours »,
                « depuis juillet 2026 », « ce mois uniquement », ou la plage.
                Sans elle, une dépense de vacances
                et une dépense de courses se ressemblent trait pour trait, et
                rien ne dit pourquoi l'une disparaît le mois suivant. Même
                micro-typographie que la mention « projection » des en-têtes de
                mois : une étiquette, pas un contenu. */}
            <span
              title={groupPeriodLabel(sg?.startMonth, sg?.endMonth)}
              className="legende text-ardoise-claire hidden min-w-0 font-normal break-words whitespace-normal sm:block sm:truncate"
            >
              {groupPeriodLabel(sg?.startMonth, sg?.endMonth)}
            </span>
            </span>
            {/* Gérer le groupe : icône discrète révélée au survol de la ligne. */}
            {!demo && <button
              type="button"
              aria-label="Gérer le groupe"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(manageDetail);
              }}
              className="text-muted-foreground hover:text-foreground ml-1 -m-1.5 shrink-0 cursor-pointer p-1.5 opacity-0 group-hover:opacity-100 pointer-coarse:opacity-100"
            >
              <Pencil className="size-3.5" />
            </button>}
            {/* Découper en sous-postes, juste à côté : le formulaire s'ouvre sous cette
                ligne-ci, là où le sous-poste ira. Il ne touche PAS au dépliage du
                groupe : le chevron montre les transactions, et ouvrir un formulaire de
                création n'a aucune raison de dérouler ce qui a déjà été dépensé. */}
            {!demo && <button
              type="button"
              aria-label="Ajouter un sous-poste"
              onClick={(e) => {
                e.stopPropagation();
                toggleAddingLine(r.id, moisDeTravail);
              }}
              className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 pointer-coarse:opacity-100"
            >
              <Plus className="size-3.5" />
            </button>}
          </NameCell>
          <AmountCells
            cells={r.cells}
            mode={r.direction}
            solde={solde.rowRunning[r.id]}
            soldePrevu={planned.prevuRowRunning[r.id]}
            soldeDepass={planned.depassRowRunning[r.id]}
            onSelect={onSelect}
            subtitleOf={(i) => `${r.name} · ${monthLabel(months[i])}`}
            detailRow={r}
            months={months}
            currentMonth={currentMonth}
            rowKey={selfKey}
            selCellKey={selCellKey}
            prevDisp={{ solde: prevDisplayedByCol.solde.get(selfKey), soldePrevu: prevDisplayedByCol.soldePrevu.get(selfKey), soldeDepass: prevDisplayedByCol.soldeDepass.get(selfKey) }}
            budgetEditOf={(m) => budgetEditOfGroup(sg, m, currentMonth)}
            signaleDepassement={(m) => groupeEnDepassement.has(`${r.id}::${m}`)}
            noticeOf={noticeDe(r.id, null)}
            onboarding={onboarding}
            onDetailOpened={onDetailOpened}
          />
        </TableRow>
        {/* Le formulaire du nouveau sous-poste, juste sous sa dépense. Hors du bloc
            replié ci-dessous : il ne dépend pas du dépliage, qui ne concerne que ce qui
            existe déjà (sous-postes et transactions). */}
        {!demo && addingLineHere(r.id, moisDeTravail) && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={totalCols} className="p-0">
              <div className={cn(BLOC_EPINE, "font-sans bg-background w-fit")}>
                <NewLineInline
                  groupId={r.id}
                  stripMin={stripMin}
                  stripMax={stripMax}
                  defaultMonth={moisDeTravail}
                  onDone={() => setAdding(null)}
                />
              </div>
            </TableCell>
          </TableRow>
        )}
        {gOpen && (
          <>
            {r.subRows.map((sub: HistorySubRow) => {
              const lKey = lineOpenKey(sub.id);
              const lOpen = isOpen(lKey);
              const subHasTxns = sub.txns.length > 0;
              // Ligne synthétisée à partir du poste : réutilise les helpers de détail
              // (budgetNodes → nœud unique, txnChildren → transactions du poste). Sans
              // subRows ni chaîne de solde, les cases Solde restent vides/non cliquables.
              const subAsRow: HistoryRow = {
                id: sub.id,
                name: sub.name,
                direction: r.direction,
                cells: sub.cells,
                // La vie propre de la ligne (sub.aliveMonths), pas celle du groupe
                // (r.aliveMonths) : une ligne ajoutée après le début d'un groupe
                // encore vivant sinon voit son repère de changement (Task 2) marquer
                // sa naissance comme une vraie hausse — voir HistorySubRow.aliveMonths.
                aliveMonths: sub.aliveMonths,
                subRows: [],
                txns: sub.txns,
              };
              const sgLine = sg?.lines.find((l) => l.id === sub.id);
              return (
                <Fragment key={sub.id}>
                  <TableRow className={cn("group text-sm", subHasTxns && "hover:bg-muted/50")}>
                    <NameCell indent={1} expandable={subHasTxns} expanded={lOpen} onToggle={subHasTxns ? () => toggleIn(lKey) : undefined}>
                      {/* Même empilement que sur la ligne du groupe au-dessus. */}
                      <span className="flex min-w-0 flex-col">
                      <span className="min-w-0 break-words whitespace-normal [hyphens:auto] sm:truncate sm:[hyphens:none]">{sub.name}</span>
                      {/* Durée de vie du poste, dite comme celle du groupe juste
                          au-dessus : un abonnement résilié en mai et un abonnement
                          permanent se ressemblent sinon trait pour trait, et rien
                          n'explique pourquoi l'un disparaît le mois suivant. */}
                      <span
                        title={groupPeriodLabel(sgLine?.startMonth, sgLine?.endMonth)}
                        className="legende text-ardoise-claire hidden min-w-0 font-normal break-words whitespace-normal sm:block sm:truncate"
                      >
                        {groupPeriodLabel(sgLine?.startMonth, sgLine?.endMonth)}
                      </span>
                      </span>
                      {/* Gérer la ligne : même crayon discret que sur la ligne de
                          groupe, révélé au survol. Une ligne est un poste à part
                          entière (Sosh Internet n'est pas Sosh Mobile) : on la renomme
                          là où on la voit, pas en la cherchant dans une liste. Le jour
                          suit le nom ; son montant, daté, se fixe dans sa case. */}
                      {!demo && <button
                        type="button"
                        aria-label="Gérer la ligne"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect({
                            title: sub.name,
                            nodes: [],
                            result: 0,
                            // Le jour vient du SelectGroup : une HistorySubRow ne porte
                            // que des chiffres par mois, pas les propriétés de la ligne.
                            lineManage: {
                              lineId: sub.id,
                              name: sub.name,
                              month: moisDeTravail,
                              stripMin,
                              stripMax,
                              startMonth: sgLine?.startMonth,
                              endMonth: sgLine?.endMonth,
                              changes: sgLine?.changes ?? [],
                            },
                          });
                        }}
                        className="text-muted-foreground hover:text-foreground ml-1 -m-1.5 shrink-0 cursor-pointer p-1.5 opacity-0 group-hover:opacity-100 pointer-coarse:opacity-100"
                      >
                        <Pencil className="size-3.5" />
                      </button>}
                    </NameCell>
                    {/* Sous-ligne (poste d'un récurrent) : cellules désormais cliquables
                        (détail dérivé du poste). Les cases Solde restent vides. */}
                    <AmountCells
                      cells={sub.cells}
                      mode={r.direction}
                      onSelect={onSelect}
                      subtitleOf={(i) => `${sub.name} · ${monthLabel(months[i])}`}
                      detailRow={subAsRow}
                      months={months}
                      currentMonth={currentMonth}
                      rowKey={subRow(sub.id)}
                      selCellKey={selCellKey}
                      budgetEditOf={(m) => budgetEditOfLine(sgLine, m, currentMonth)}
                      signaleDepassement={(m) => depassementDeCase.has(`${r.id}::${sub.id}::${m}`)}
                      noticeOf={noticeDe(r.id, sub.id)}
                      onboarding={onboarding}
                      onDetailOpened={onDetailOpened}
                    />
                  </TableRow>
                  {lOpen && sub.txns.map((t) => (
                    <TxnRow key={t.id} txn={t} months={months} currentMonth={currentMonth} groups={groups} indent={2} onSelect={onSelect} selCellKey={selCellKey} demo={demo} />
                  ))}
                </Fragment>
              );
            })}
            {r.txns.map((t) => (
              <TxnRow key={t.id} txn={t} months={months} currentMonth={currentMonth} groups={groups} indent={1} onSelect={onSelect} selCellKey={selCellKey} demo={demo} />
            ))}
          </>
        )}
      </Fragment>
    );
  };

  // Ligne dédiée affichant le Reste/Manque final de la section des dépenses, en bas
  // du tableau, dans la colonne Reste/Manque. Le montant est retiré de la ligne
  // « Total ... » et reporté ici.
  const renderSectionResteRow = (kind: "expense", label: string, secs: HistorySection[]) => {
    const sec = secs.find((s) => s.kind === kind);
    if (!sec) return null;
    const rowKey = `reste:${kind}`;
    return (
      <TableRow className="text-sm">
        <TableCell className={cn(COL1_STICKY, "bg-background h-px p-0")}>
          <FirstColBox><span className="text-muted-foreground">{label}</span></FirstColBox>
        </TableCell>
        {months.map((m, i) => {
          const type = monthType(m, currentMonth);
          const cols = monthColumns(type);
          const c = sec.totals[i];
          const subtitle = `${label} · ${monthLabel(m)}`;
          // Décomposition Budget − Dépensé (les sections de dépense vérifient l'invariant).
          const depNodes = sec.rows.map((r) => groupNode(r, i, m, "depense")).filter((n) => n.amount !== 0);
          const detail: CellDetail = makeDetail(
            "Reste",
            [
              { label: "Budget", amount: c.budgeted, ref: cellKey(sectionRow(kind), "budget", i) },
              { label: "Dépensé", amount: -c.depense, ref: cellKey(sectionRow(kind), "depense", i), children: depNodes.map(negateNode) },
            ],
            { subtitle, result: c.balance },
          );
          const resteCell = (b: boolean) => (
            <CellAmount key="reste" className={cn(b && MONTH_GAP, "text-right tabular-nums", resteColor(c.balance))} detail={detail} onSelect={onSelect} cellKey={cellKey(rowKey, "reste", i)} selCellKey={selCellKey}>
              {fmt(c.balance)}
            </CellAmount>
          );
          const slots = blankSlots();
          slots.reste = resteCell;
          return <Fragment key={i}>{renderCols(cols, slots)}</Fragment>;
        })}
      </TableRow>
    );
  };

  // Ligne « Non catégorisés » d'une des deux sections (reçus / dépenses) : total
  // dépliable sur ses transactions. Les reçus s'affichent sous les rémunérations,
  // les dépenses après les enveloppes.
  const renderUncatRows = (sec: HistorySection, secs: HistorySection[]) => {
    const dir = sec.uncatDirection ?? "out";
    const uKey = uncatOpenKey(dir);
        const uOpen = isOpen(uKey);
    const hasTxns = (sec.txns?.length ?? 0) > 0;
    const rowKey = sectionRowKey(sec);
    // Valeurs courues des chaînes du plan à cette étape (calculées par
    // computePlannedSoldes dans l'ordre de lecture, débordement net déjà retiré
    // pour la ligne dépenses).
    const planPrevu = planned.uncatPrevuRunning[dir];
    const planDepass = planned.uncatDepassRunning[dir];
    return (
      <>
        <TableRow className="font-medium">
          <NameCell indent={0} expandable={hasTxns} expanded={uOpen} onToggle={hasTxns ? () => toggleIn(uKey) : undefined}>
            {/* Le sens dans le nom. Les deux lignes s'appelaient « Non catégorisés »
                et rien ne les distinguait : celle des encaissements se lit tout en
                haut, celle des décaissements plus bas, mais quand aucun revenu n'est
                encore créé la première se retrouve seule, sans en-tête pour dire ce
                qu'elle est. On croit alors voir deux fois la même chose. */}
            <span className="min-w-0 break-words whitespace-normal [hyphens:auto] sm:truncate sm:[hyphens:none]">
              {dir === "in" ? "Reçus non catégorisés" : "Dépenses non catégorisées"}
            </span>
          </NameCell>
          <SectionTotalsCells accountId={accountId}             sec={sec}
            months={months}
            currentMonth={currentMonth}
            onSelect={onSelect}
            solde={solde.uncategorizedRunning?.[dir] ?? undefined}
            planPrevu={planPrevu}
            planDepass={planDepass}
            uncatInSec={dir === "out" ? secs.find((s) => s.kind === "uncategorized" && s.uncatDirection === "in") : undefined}
            selCellKey={selCellKey}
            prevDisp={{ solde: prevDisplayedByCol.solde.get(rowKey), soldePrevu: prevDisplayedByCol.soldePrevu.get(rowKey), soldeDepass: prevDisplayedByCol.soldeDepass.get(rowKey) }}
            noticeOf={noticeDe(0, null)}
            onboarding={onboarding}
          />
        </TableRow>
        {uOpen && sec.txns?.map((t) => (
          <TxnRow key={t.id} txn={t} months={months} currentMonth={currentMonth} groups={groups} indent={1} onSelect={onSelect} selCellKey={selCellKey} demo={demo} />
        ))}
      </>
    );
  };

  // Bloc « Non comptabilisées » (reçus ou dépenses) : un total dépliable sur ses
  // transactions, rendu tout en bas du tableau. Le sens se lit dans la colonne :
  // Reçu pour les entrées, Dép. pour les sorties. Ces montants ne sont additionnés
  // nulle part ailleurs — la ligne est purement informative.
  const renderIgnoredBlock = (block: IgnoredBlock) => {
    const isIn = block.direction === "in";
    const key = `s:ignored-${block.direction}`;
        const opened = isOpen(key);
    const title = isIn ? "Non comptabilisées — Reçus" : "Non comptabilisées — Dépenses";
    const rowId = sectionRow(`ignored-${block.direction}`);
    return (
      <Fragment key={key}>
        <TableRow className="font-medium">
          <NameCell indent={0} expandable expanded={opened} onToggle={() => toggleIn(key)}>
            <span className="min-w-0 break-words whitespace-normal [hyphens:auto] sm:truncate sm:[hyphens:none]">{title}</span>
          </NameCell>
          {months.map((m, i) => {
            const val = isIn ? block.totals[i].recu : block.totals[i].depense;
            const nodes = block.txns
              .filter((t) => t.month === m)
              .map((t) => txnNode(t.date, t.label, Math.abs(t.amount), cellKey(txnRow(t.id), isIn ? "recu" : "depense", i)));
            const detail: CellDetail | null =
              val > 0.005 ? makeDetail(title, nodes, { subtitle: monthLabel(m), result: val }) : null;
            const cell = (b: boolean) => (
              <CellAmount
                key="ignored"
                className={cn(b && MONTH_GAP, "text-right tabular-nums text-muted-foreground")}
                detail={detail}
                onSelect={onSelect}
                cellKey={cellKey(rowId, isIn ? "recu" : "depense", i)}
                selCellKey={selCellKey}
              >
                {val > 0.005 ? fmt(val) : ""}
              </CellAmount>
            );
            const slots = blankSlots();
            if (isIn) slots.recu = cell;
            else slots.dep = cell;
            const cols = monthColumns(monthType(m, currentMonth));
            return <Fragment key={i}>{renderCols(cols, slots)}</Fragment>;
          })}
        </TableRow>
        {opened &&
          block.txns.map((t) => (
            <TxnRow
              key={t.id}
              txn={t}
              months={months}
              currentMonth={currentMonth}
              groups={groups}
              indent={1}
              onSelect={onSelect}
              selCellKey={selCellKey}
              ignored
              demo={demo}
            />
          ))}
      </Fragment>
    );
  };

  // Le grand tableau, un seul pour tous les mois affichés.
  //
  // Il y a eu un tableau par mois, posés côte à côte : chacun réécrivait la colonne
  // des noms de postes, si bien qu'à trois mois on lisait trois fois « Courses »,
  // « Essence », « Loyer ». Il n'y en a plus qu'un. Les noms s'écrivent une fois, à
  // gauche, et cette colonne reste collée au bord quand on fait défiler les mois.
  //
  // Une ligne traverse donc des mois où elle ne vit pas : elle y reste, mais ses
  // cases se vident (cf. ligneVivante, appliqué dans AmountCells). Écrire 0,00 €
  // sous une enveloppe qui ne commence qu'en septembre ferait lire un budget épuisé
  // là où il n'y a encore rien.
  const grandTableau = () => {
    const secs = sections;

    // Une bande de section : son nom dans l'épine, sa teinte en travers de tous les
    // mois, et ce qu'elle porte de commandes (replier, créer).
    const bande = (cle: string, titre: string, tint: string, opts?: {
      replie?: boolean;
      onToggle?: () => void;
      action?: React.ReactNode;
      onboardingTarget?: string;
    }) => (
      <TableRow key={cle} data-onboarding-target={opts?.onboardingTarget} className="hover:bg-transparent">
        <TableCell className={cn(COL1_STICKY, tint, "h-px p-0")}>
          {/* Sur téléphone le nom du bloc et son bouton de création ne tiennent pas
              côte à côte dans 176 px : « Dépenses non prévues » passait SOUS le
              bouton, et on lisait « Dépenses [+ Dépense] és ». Ils s'empilent donc,
              le titre d'abord, le bouton dessous. */}
          <div className={cn("border-border/60 flex h-full flex-col items-start gap-1 border-r py-2 pr-2 pl-2 font-sans sm:flex-row sm:items-center sm:gap-2", COL1_W)}>
            {opts?.onToggle ? (
              <button
                type="button"
                onClick={opts.onToggle}
                aria-expanded={!opts.replie}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-1"
              >
                {opts.replie ? <ChevronRight className="size-3.5 shrink-0" /> : <ChevronDown className="size-3.5 shrink-0" />}
                <span className="legende min-w-0 text-left leading-tight">{titre}</span>
              </button>
            ) : (
              <span className="legende min-w-0 leading-tight">{titre}</span>
            )}
            {opts?.action}
          </div>
        </TableCell>
        {/* La bande suit la même règle de colonnes que les lignes de données : sa
            couleur ne lave que ce qui est à gauche de Balance. Balance garde son
            gris et les trois soldes le leur, sinon la bande couperait en travers
            les deux seules colonnes qu'on lit de haut en bas. */}
        {months.map((m) => {
          const cols = monthColumns(monthType(m, currentMonth));
          return <Fragment key={m}>{renderCols(cols, blankSlots(), undefined, tint)}</Fragment>;
        })}
      </TableRow>
    );

    // En-tête unique de toutes les sorties : son nom, la flèche qui replie les lignes,
    // le bouton d'ajout et le formulaire quand il est ouvert.
    const enTeteDepense = () => {
      return (
        <>
          {bande("bloc-expenses", "Ce qui sort", BANDE_TENSION, {
            replie: depensesRepliees,
            onToggle: () => setDepensesRepliees((value) => !value),
            onboardingTarget: onboarding?.expensesTarget,
            action: !demo ? (
              <Button type="button" size="xs" variant="outline" className="shrink-0 cursor-pointer sm:ml-auto" onClick={() => toggleAdding("expense", moisDeTravail)}>
                <Plus />
                Dépense
              </Button>
            ) : null,
          })}
          {!demo && addingHere(moisDeTravail) === "expense" && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={totalCols} className="p-0">
                <div className={cn(BLOC_EPINE, "font-sans bg-background w-fit")}>
                  {/* Créé depuis le tableau d'un mois : ce mois-là est proposé
                      d'emblée comme mois de départ. */}
                  <NewGroupInline
                    accountId={accountId}
                    stripMin={stripMin}
                    stripMax={stripMax}
                    defaultMonth={moisDeTravail}
                    planned
                    onDone={() => setAdding(null)}
                  />
                </div>
              </TableCell>
            </TableRow>
          )}
        </>
      );
    };

    // En-tête de la section des revenus, jumelle de celle des dépenses : un seul
    // bouton, toujours là. Avant, il y en avait deux — « principale » et
    // « supplémentaire » — qui disparaissaient une fois cliqués, parce qu'un compte
    // n'avait droit qu'à un exemplaire de chaque. On peut maintenant en créer autant
    // qu'on en reçoit, et c'est leur durée qui dit lesquels se reproduisent.
    const enTeteRevenu = () => (
      <>
        {bande("bloc-revenu", "Ce qui rentre", BANDE_PORTANT, {
          onboardingTarget: onboarding?.incomeTarget,
          action: !demo ? (
            <Button type="button" size="xs" variant="outline" className="shrink-0 cursor-pointer sm:ml-auto" onClick={() => toggleAdding("income", moisDeTravail)}>
              <Plus />
              Revenu
            </Button>
          ) : null,
        })}
        {!demo && addingHere(moisDeTravail) === "income" && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={totalCols} className="p-0">
              <div className={cn(BLOC_EPINE, "font-sans bg-background w-fit")}>
                <NewGroupInline
                  accountId={accountId}
                  direction="in"
                  stripMin={stripMin}
                  stripMax={stripMax}
                  defaultMonth={moisDeTravail}
                  onDone={() => setAdding(null)}
                />
              </div>
            </TableCell>
          </TableRow>
        )}
      </>
    );

    return (
    <>
    {/* w-max : la largeur du tableau suit son contenu, pas le conteneur. Sinon
        (w-full par defaut) les colonnes se resserrent quand la sidebar de detail
        s'ouvre et retrecit la zone : le tableau doit defiler, pas se tasser. */}
    {/* tabular-nums sur TOUT le tableau : le défaut ici, c'est le chiffre. Les rares
        zones de texte (première colonne, en-têtes) repassent en font-sans. 13px
        compense la chasse fixe, plus large que la proportionnelle, pour garder la
        même densité horizontale. */}
    {/* [&_td]:align-top : une Balance en dépassement porte son étiquette SOUS le
        montant, donc sa cellule est plus haute que les autres. Avec l'alignement
        vertical centré par défaut, le montant remonterait de quelques pixels par
        rapport aux chiffres du reste de la ligne. Calés en haut, tous les nombres
        d'une même ligne restent sur la même ligne de base ; les lignes sans
        étiquette, qui tiennent sur une seule ligne, ne bougent pas. */}
    <Table
      className={cn(
        "w-max text-[13px] tabular-nums [&_td]:align-top",
        // Le serrage de téléphone. Il ne touche QUE les cases de chiffres —
        // reconnaissables à leur tabular-nums — parce que l'épine, elle, porte du
        // texte : la rétrécir aussi rendrait les noms de postes illisibles. Onze
        // pixels et deux de gouttière font gagner une centaine de pixels par mois,
        // soit une colonne et demie de plus à l'écran.
        "max-sm:[&_td.tabular-nums]:px-1 max-sm:[&_td.tabular-nums]:text-[11px]",
        "max-sm:[&_th.tabular-nums]:px-1 max-sm:[&_th.tabular-nums]:text-[11px]",
      )}
    >
      {/* Le colgroup ne porte plus de teinte : il ne reste que la structure des
          colonnes, qui sert au calage des largeurs. */}
      <colgroup>
        <col />
        {months.flatMap((m) =>
          monthColumns(monthType(m, currentMonth)).map((col) => <col key={`${m}-${col}`} />),
        )}
      </colgroup>
      <TableHeader>
        {/* Le nom du mois coiffe son bloc, centré. L'épine reste nue : la maquette
            n'y met aucun intitulé, et « Catégorie » n'apprenait rien à personne. */}
        <TableRow className="hover:bg-transparent">
          <TableHead rowSpan={2} data-epine="" className={cn(COL1_STICKY, "bg-card h-px p-0 align-bottom")}>
            <FirstColBox>&nbsp;</FirstColBox>
          </TableHead>
          {months.map((m, mi) => {
            const cols = monthColumns(monthType(m, currentMonth));
            const nonComptees = countIgnoredAtMonth(ignoredBlocks, m);
            const futur = m > currentMonth;
            return (
              <TableHead
                key={m}
                colSpan={cols.length}
                data-current-month={m === currentMonth ? "" : undefined}
                data-onboarding-target={m === onboarding?.month ? onboarding?.timeTarget : undefined}
                data-onboarding-month={m === onboarding?.month ? onboarding?.month : undefined}
                className={cn(mi > 0 && MONTH_RULE, "px-2 pt-4 pb-1 text-left align-middle sm:px-4 sm:text-center")}
              >
                {/* Le nom du mois se pose À GAUCHE de son bloc sur téléphone. Centré, il
                    tombait au milieu de six cents pixels de colonnes : on arrivait sur
                    le tableau sans savoir quel mois on regardait, le titre étant hors
                    de l'écran à droite. */}
                <div className="flex items-baseline justify-start gap-2 whitespace-nowrap sm:justify-center">
                  <span className={cn("font-display text-lg leading-none", futur && "text-muted-foreground")}>
                    {monthName(m)}
                  </span>
                  <span className="text-ardoise-claire text-[11px] leading-none tabular-nums">
                    {m.slice(0, 4)}
                  </span>
                </div>
                {futur && <div className="legende text-ardoise-claire mt-1.5">projection</div>}
                {/* Ce que ce mois laisse hors des calculs. Même formulation et même
                    étiquette dormante que sur la page Transactions. */}
                {nonComptees > 0 && (
                  <div className="mt-1.5">
                    <span className="pastille">{nonComptees} hors calcul</span>
                  </div>
                )}
              </TableHead>
            );
          })}
        </TableRow>
        <TableRow>
          {months.map((m, mi) => {
            const cols = monthColumns(monthType(m, currentMonth));
            return (
              <Fragment key={m}>
                {/* Intitulés courts, ceux de la maquette. Les longs (« Solde si
                    dépassement ») fixaient à eux seuls la largeur de leur colonne et
                    étiraient tout le tableau. Le mot entier reste dans l'explication
                    qu'un clic ouvre. */}
                {cols.map((col, idx) => (
                  <TableHead
                    key={col}
                    className={cn(
                      COL_TINT[col],
                      idx === 0 && mi > 0 && MONTH_RULE,
                      "legende h-auto px-1 pt-1 pb-2 text-right align-bottom sm:px-2",
                    )}
                  >
                    <button
                      type="button"
                      title={COL_LABEL[col]}
                      onClick={() => onSelect(makeInfo(COL_LABEL[col], COL_INFO[col]))}
                      className="hover:text-foreground cursor-pointer decoration-dotted underline-offset-2 hover:underline"
                    >
                      {COL_COURT[col]}
                    </button>
                  </TableHead>
                ))}
              </Fragment>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className="font-medium">
          <TableCell className={cn(COL1_STICKY, "bg-background h-px p-0")}>
            <FirstColBox>Argent de départ</FirstColBox>
          </TableCell>
          {solde.openings.map((v, i) => {
            // 1er mois affiché : reconstitué en rembobinant depuis le solde réel de
            // la banque (forecast.balance = a.balance, l'ancre de computeSolde).
            // Mois suivants : hérité du solde de clôture du mois précédent.
            const detail: CellDetail =
              i === 0
                ? makeDetail(
                    "Argent de départ",
                    [
                      { label: "Solde du compte (banque)", amount: forecast.balance },
                      { label: "Mouvements de la période (rembobinés)", amount: solde.openings[0] - forecast.balance },
                    ],
                    {
                      subtitle: monthLabel(months[0]),
                      result: solde.openings[0],
                      note: "Reconstitué en rembobinant les mouvements depuis le solde réel de la banque.",
                    },
                  )
                : months[i - 1] === currentMonth && months[i] > currentMonth
                  ? // Premier mois futur : il s'ouvre sur l'estimé de fin du mois courant.
                    makeDetail(
                      "Argent de départ",
                      [{ label: "Estimé fin du mois précédent", amount: solde.openings[i], ref: cellKey("estime", "solde", i - 1) }],
                      { subtitle: monthLabel(months[i]), result: solde.openings[i] },
                    )
                  : makeDetail(
                      "Argent de départ",
                      [{ label: "Solde de fin du mois précédent", amount: solde.closings[i - 1], ref: cellKey("grand", "solde", i - 1) }],
                      { subtitle: monthLabel(months[i]), result: solde.openings[i] },
                    );
            const type = monthType(months[i], currentMonth);
            const cols = monthColumns(type);
            // L'ouverture est commune aux trois chaînes au mois courant. En
            // projection, l'ouverture d'une chaîne = clôture (prévue / si dépassement)
            // du mois précédent ; repli sur l'argent de départ réel au 1er mois.
            // Mois passés et courant : le plan s'ancre sur l'ouverture réelle du mois.
            // Premier mois futur : les deux chaînes repartent de l'estimé de fin du
            // mois courant. Mois futurs suivants : elles enchaînent sur la clôture
            // (prévue / si dépassement) du mois précédent.
            const firstFuture = months[i] > currentMonth && i > 0 && months[i - 1] === currentMonth;
            const prevuOpen =
              months[i] <= currentMonth ? v
              : firstFuture ? estimateValue
              : i > 0 && planned.prevuClosings[i - 1] != null ? planned.prevuClosings[i - 1] : v;
            const depassOpen =
              months[i] <= currentMonth ? v
              : firstFuture ? estimateValue
              : i > 0 && planned.depassClosings[i - 1] != null ? planned.depassClosings[i - 1] : v;
            const openingCell = (b: boolean) => (
              <CellAmount key="soldeReel" className={cn(b && MONTH_GAP, "text-right tabular-nums", soldeColor(v))} detail={detail} onSelect={onSelect} cellKey={cellKey(openingRow, "solde", i)} selCellKey={selCellKey}>
                {fmt(v)}
              </CellAmount>
            );
            // Détail des ouvertures de plan : sur un mois passé ou courant, l'ouverture
            // prévue / si dépassement vaut l'argent de départ réel (même détail). En
            // projection, elle vaut la clôture (prévue / si dépassement) du mois passé.
            const prevuOpenDetail: CellDetail =
              months[i] <= currentMonth
                ? detail
                : firstFuture
                  ? makeDetail(
                      "Argent de départ",
                      [{ label: "Estimé fin du mois précédent", amount: prevuOpen ?? 0, ref: cellKey("estime", "solde", i - 1) }],
                      { subtitle: monthLabel(months[i]), result: prevuOpen ?? 0 },
                    )
                  : makeDetail(
                      "Argent de départ",
                      [{ label: "Solde prévu de fin du mois précédent", amount: prevuOpen ?? 0, ref: i > 0 ? cellKey("grand", "soldePrevu", i - 1) : undefined }],
                      { subtitle: monthLabel(months[i]), result: prevuOpen ?? 0 },
                    );
            const depassOpenDetail: CellDetail =
              months[i] <= currentMonth
                ? detail
                : firstFuture
                  ? makeDetail(
                      "Argent de départ",
                      [{ label: "Estimé fin du mois précédent", amount: depassOpen ?? 0, ref: cellKey("estime", "solde", i - 1) }],
                      { subtitle: monthLabel(months[i]), result: depassOpen ?? 0 },
                    )
                  : makeDetail(
                      "Argent de départ",
                      [{ label: "Solde de fin du mois précédent (si dépassement)", amount: depassOpen ?? 0, ref: i > 0 ? cellKey("grand", "soldeDepass", i - 1) : undefined }],
                      { subtitle: monthLabel(months[i]), result: depassOpen ?? 0 },
                    );
            const slots = blankSlots();
            slots.soldeReel = openingCell;
            slots.soldePrevu = (b) => plannedSoldeCell("soldePrevu", prevuOpen, b, prevuOpenDetail, onSelect, cellKey(openingRow, "soldePrevu", i), selCellKey);
            slots.soldeDepass = (b) => plannedSoldeCell("soldeDepass", depassOpen, b, depassOpenDetail, onSelect, cellKey(openingRow, "soldeDepass", i), selCellKey);
            return <Fragment key={i}>{renderCols(cols, slots)}</Fragment>;
          })}
        </TableRow>
        {sectionSlots(secs).map((slot, si) => {
          // Un petit espace sépare chaque section de la précédente.
          const spacer = si > 0 ? <SpacerRow cols={totalCols} /> : null;
          // Emplacement d'une section encore inexistante : son bouton d'ajout, et
          // rien d'autre. Pas de total ni de Balance — il n'y a rien à totaliser.
          if (slot.kind === "empty") {
            return (
              <Fragment key={`vide-${slot.sectionKind}`}>
                {spacer}
                {slot.sectionKind === "income"
                  ? enTeteRevenu()
                  : enTeteDepense()}
              </Fragment>
            );
          }
          const sec = slot.section;
          if (sec.kind === "income") {
            // Revenus : lignes au niveau des sections, tout en haut, puis les reçus
            // non catégorisés, puis une ligne « Total revenus ».
            const uncatIn = secs.find((s) => s.kind === "uncategorized" && s.uncatDirection === "in");
            return (
              <Fragment key={sec.kind}>
                {spacer}
                {enTeteRevenu()}
                <TeinteSection.Provider value={INCOME_TINT}>
                  {sec.rows.map((r) => renderGroup(r, true))}
                </TeinteSection.Provider>
                {uncatIn && (
                  <TeinteSection.Provider value={INCOME_TINT}>
                    {renderUncatRows(uncatIn, secs)}
                  </TeinteSection.Provider>
                )}
                <TableRow className="font-medium">
                  <TableCell className={cn(INCOME_TOTAL_TINT, COL1_STICKY, "h-px p-0")}>
                    <FirstColBox>Total revenus</FirstColBox>
                  </TableCell>
                  <TeinteSection.Provider value={INCOME_TOTAL_TINT}>
                    <IncomeTotalCells sec={sec} months={months} currentMonth={currentMonth} onSelect={onSelect} selCellKey={selCellKey} />
                  </TeinteSection.Provider>
                </TableRow>
              </Fragment>
            );
          }
          if (sec.kind === "uncategorized") {
            // Les reçus non catégorisés sont rendus dans la section Rémunérations
            // (ci-dessus) quand elle existe ; sinon ils s'affichent ici, à leur place.
            if (sec.uncatDirection === "in" && secs.some((s) => s.kind === "income")) return null;
            // Un espace au-dessus des dépenses non catégorisées : elles suivent le
            // « Total Dépenses » et sa Balance, qui closent les enveloppes, et se
            // lisent mal collées à eux. Les reçus non catégorisés, eux, restent
            // attachés à ce qui les précède.
            return (
              <Fragment key={`uncat-${sec.uncatDirection ?? "out"}`}>
                {(sec.uncatDirection ?? "out") === "out" && bande("bloc-uncat", "Pas encore rangé", BANDE)}
                {/* Les non catégorisés portent la couleur de leur sens : ce qui entre
                    avec les revenus, ce qui sort avec les dépenses. */}
                <TeinteSection.Provider value={(sec.uncatDirection ?? "out") === "in" ? INCOME_TINT : EXPENSE_TINT}>
                  {renderUncatRows(sec, secs)}
                </TeinteSection.Provider>
              </Fragment>
            );
          }
          // Toutes les dépenses partagent désormais une seule section. Leur classement
          // historique reste intact dans les données ; seule la séparation visuelle a
          // disparu.
          return (
            <Fragment key={sec.kind}>
              {spacer}
              {enTeteDepense()}
              {!depensesRepliees && (
                <TeinteSection.Provider value={EXPENSE_TINT}>
                  {sec.rows.map((r) => renderGroup(r))}
                </TeinteSection.Provider>
              )}
              <TableRow className="font-medium">
                <TableCell className={cn(EXPENSE_TOTAL_TINT, COL1_STICKY, "h-px p-0")}>
                  <FirstColBox>Total Dépenses</FirstColBox>
                </TableCell>
                <TeinteSection.Provider value={EXPENSE_TOTAL_TINT}>
                  <SectionTotalsCells accountId={accountId} sec={sec} months={months} currentMonth={currentMonth} onSelect={onSelect} selCellKey={selCellKey} />
                </TeinteSection.Provider>
              </TableRow>
              {renderSectionResteRow("expense", "Balance dépenses", secs)}
            </Fragment>
          );
        })}
        {/* Le pied, en encre pleine et d'un seul bloc : ce que le mois a pesé, où
            il finit, où il finirait, ce qu'il a débordé. C'est le tampon du relevé.
            Le total et le solde étaient une seule ligne qui faisait les deux métiers,
            et le solde s'y lisait comme un total de plus. */}
        <TableRow style={PIED_CARBONE} className={cn(PIED_LIGNE, "font-semibold")}>
          <TableCell className={cn(COL1_STICKY, "bg-encre h-px p-0")}>
            <FirstColBox>Total du mois</FirstColBox>
          </TableCell>
          <GrandTotalsCells part="totaux" sections={secs} grand={grand} solde={solde} planned={planned} months={months} currentMonth={currentMonth} currentEstimate={estimateValue} onSelect={onSelect} selCellKey={selCellKey} />
        </TableRow>
        <TableRow data-onboarding-target={onboarding?.endingBalanceTarget} style={PIED_CARBONE} className={cn(PIED_LIGNE, "font-semibold")}>
          <TableCell className={cn(COL1_STICKY, "bg-encre h-px p-0")}>
            <FirstColBox>Solde de fin de mois</FirstColBox>
          </TableCell>
          <GrandTotalsCells part="soldes" sections={secs} grand={grand} solde={solde} planned={planned} months={months} currentMonth={currentMonth} currentEstimate={estimateValue} onSelect={onSelect} selCellKey={selCellKey} />
        </TableRow>
        {/* Estimé fin de mois, DANS le pied et sous le solde : c'est la même
            question posée un cran plus loin — le solde dit où le mois en est, l'estimé
            où il finira si le plan tient. Les lire l'un sous l'autre, sur le même
            encre, fait de l'écart entre les deux la dernière chose qu'on voit.
            Le calcul : mois courant = Total + rémunérations restant
            à recevoir − Balances vertes (le budget restant, supposé dépensé d'ici la
            fin du mois) ; autres mois = leur solde de clôture (même détail que la
            ligne « Total » pour ce mois — cf. soldeActuelDetail). */}
        <TableRow style={PIED_CARBONE} className={cn(PIED_LIGNE, "text-sm")}>
          <TableCell className={cn(COL1_STICKY, "bg-encre h-px p-0")}>
            <FirstColBox><span className="text-muted-foreground">Estimé fin de mois</span></FirstColBox>
          </TableCell>
          {months.map((m, i) => {
            const isCurrent = m === currentMonth;
            const v = isCurrent ? estimateValue : solde.closings[i];
            const detail: CellDetail = isCurrent
              ? makeDetail(
                  "Estimé fin de mois",
                  [
                    { label: "Total", amount: forecast.balance, ref: cellKey("grand", "solde", i) },
                    ...(tableEstimate?.incomeSteps ?? []).map((s): DetailNode => ({
                      label: `${s.name} — reste à recevoir`,
                      amount: s.amount,
                      ref: cellKey(groupRow(s.id), "revenus", i),
                    })),
                    ...(tableEstimate?.spendSteps ?? []).map((s): DetailNode => ({
                      label: `${s.name} — reste à dépenser`,
                      amount: -s.amount,
                      ref: cellKey(groupRow(s.id), "reste", i),
                    })),
                  ],
                  { subtitle: monthLabel(m), result: v },
                )
              : soldeActuelDetail(secs, solde, i, m, { title: "Estimé fin de mois", result: solde.closings[i] });
            const type = monthType(m, currentMonth);
            const cols = monthColumns(type);
            const estCell = (b: boolean) => (
              <CellAmount key="est" className={cn(b && MONTH_GAP, "text-right tabular-nums", soldeColor(v))} detail={detail} onSelect={onSelect} cellKey={cellKey("estime", "solde", i)} selCellKey={selCellKey}>
                {fmt(v)}
              </CellAmount>
            );
            const slots = blankSlots();
            // Sur les mois de projection, l'« Estimé fin de mois » répéterait le
            // « Solde réel » (la ligne « Total ») déjà affiché plus haut : on laisse vide.
            if (m <= currentMonth) slots.soldeReel = estCell;
            return <Fragment key={i}>{renderCols(cols, slots)}</Fragment>;
          })}
        </TableRow>
        {/* Dépassement final du mois : somme des montants rouges de la colonne
            Balance (groupes qui débordent + Non catégorisés), hors lignes
            « Balance dépenses » qui agrège déjà ces montants. */}
        <TableRow style={PIED_CARBONE} className={cn(PIED_LIGNE, "text-sm")}>
          <TableCell className={cn(COL1_STICKY, "bg-encre h-px p-0")}>
            <FirstColBox><span className="text-muted-foreground">Total dépassement hors budget</span></FirstColBox>
          </TableCell>
          {months.map((m, i) => {
            // Part rouge de la Balance des non catégorisés (ligne dépenses) = dépensé
            // au-delà des reçus non catégorisés (la ligne du haut).
            const uncatDep = uncatOverspend(secs, i);
            const val = overspend[i] + uncatDep;
            const nodes: DetailNode[] = [
              ...secs
                .flatMap((s) => s.rows)
                .filter((r) => r.direction === "out" && r.cells[i].balance < -0.005)
                .map((r): DetailNode => ({ label: r.name, amount: -r.cells[i].balance, ref: cellKey(groupRow(r.id), "reste", i) })),
              ...(uncatDep > 0.005
                ? [{ label: "Non catégorisés", amount: uncatDep, ref: cellKey(sectionRow("uncategorized"), "reste", i) }]
                : []),
            ];
            const detail: CellDetail | null =
              val > 0.005 ? makeDetail("Total dépassement hors budget", nodes, { subtitle: monthLabel(m), result: val }) : null;
            const type = monthType(m, currentMonth);
            const cols = monthColumns(type);
            const depCell = (b: boolean) => (
              <CellAmount key="overspend" className={cn(b && MONTH_GAP, "text-right tabular-nums", val > 0.005 && "text-tension-encre")} detail={detail} onSelect={onSelect} cellKey={cellKey("overspend", "reste", i)} selCellKey={selCellKey}>
                {val > 0.005 ? fmt(val) : ""}
              </CellAmount>
            );
            const slots = blankSlots();
            slots.reste = depCell;
            return <Fragment key={i}>{renderCols(cols, slots)}</Fragment>;
          })}
        </TableRow>
        {/* Transactions mises hors calcul : affichées pour mémoire, en dehors de
            toute somme. Elles arrivent après les lignes de solde, justement pour
            qu'on voie qu'elles ne participent à rien de ce qui précède. */}
        {(ignoredBlocks?.length ?? 0) > 0 && (
          <>
            <SpacerRow cols={totalCols} />
            {/* Ramenés au mois de CE tableau : leurs transactions couvrent toute la
                frise, et dépliées ici elles montraient aussi celles des autres mois. */}
            {ignoredBlocks!.map((b) => renderIgnoredBlock(b))}
          </>
        )}
      </TableBody>
    </Table>
    </>
    );
  };

  return (
    // Un tableau par mois, légèrement espacés, dans le défilement horizontal
    // habituel. w-max : la rangée fait la largeur de ses tableaux, elle ne se tasse
    // pas quand le panneau de détail s'ouvre.
    // Ce conteneur sert aussi d'ancre pour retrouver, par data-cellkey, la case
    // sélectionnée à faire défiler dans la vue.
    <SoldeDetaille.Provider value={showDeltas ?? false}>
      {/* Deux zones de défilement horizontal s'emboîtaient : celle du tableau
          (fournie par le composant Table) et celle qui centre le mois courant. Une
          colonne collante s'accroche à la PLUS PROCHE, donc à celle de l'intérieur —
          qui ne défile jamais, puisque c'est l'autre qui porte le mouvement. La
          colonne des noms se laissait alors emporter et disparaissait. Ouvrir celle
          de l'intérieur laisse une seule zone, la bonne. */}
      <div ref={gridRef} className="w-max [&_[data-slot=table-container]]:overflow-visible">
        {grandTableau()}
      </div>
    </SoldeDetaille.Provider>
  );
}
