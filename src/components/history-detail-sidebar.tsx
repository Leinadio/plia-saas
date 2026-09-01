"use client";
import { useState } from "react";
import { X, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CellDetail } from "@/lib/history-explain";
import { detailKey } from "@/lib/history-detail";
import { OverspendNotice } from "@/components/overspend-notice";
import { TruncatedText } from "@/components/truncated-text";
import { flattenNodes, cellsForNode, cellsForTotal, symbolePose, TOTAL_ROW, type PanelRow } from "@/lib/history-nav";
// Les cinq blocs d'édition vivent à part : le panneau n'est plus leur seul lecteur,
// ces blocs se rendent aussi sur place ailleurs (voir src/components/history-blocks/).
import { BudgetEditBlock } from "@/components/history-blocks/budget-edit-block";
import { GroupManageBlock } from "@/components/history-blocks/group-manage-block";
import { LineManageBlock } from "@/components/history-blocks/line-manage-block";
import { UncatProvisionBlock } from "@/components/history-blocks/uncat-provision-block";
import { Sidebar, SidebarHeader, SidebarContent } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const NUM = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtAbs = (n: number) => NUM.format(Math.abs(n) < 0.005 ? 0 : Math.abs(n)).replace(/[  ]/g, " ");
const fmtSigned = (n: number) => NUM.format(Math.abs(n) < 0.005 ? 0 : n).replace(/[  ]/g, " ");

// Surbrillance d'une ligne sélectionnée : fond foncé + liseré d'accent à gauche
// rendu par une ombre interne (pas une bordure) pour ne pas décaler le tableau.
// On fixe aussi la couleur au survol (hover:) sur la même teinte foncée, sinon le
// hover:bg-muted/50 de la TableRow l'éclaircirait au passage de la souris.
const HL =
  "bg-[color-mix(in_oklab,var(--primary)_18%,var(--background))] hover:bg-[color-mix(in_oklab,var(--primary)_18%,var(--background))] shadow-[inset_3px_0_0_0_var(--primary)]";

// L'OPÉRATION POSÉE. Le calcul se lit comme sur du papier : les libellés à gauche,
// les opérateurs alignés dans leur propre colonne, les montants alignés sur leur
// virgule à droite, un trait, et la somme dessous.
//
// L'ordre a changé — le montant était à gauche du libellé. Une addition dont les
// termes sont à gauche et les mots à droite n'est pas une opération, c'est une
// liste ; on ne peut pas la vérifier du regard. Posée, on descend la colonne des
// chiffres et le total tombe sous le trait.
//
// Trois colonnes plutôt qu'une chaîne « + 120,00 » : l'opérateur doit rester à sa
// place quand le montant grandit d'un chiffre, sinon la colonne se décale d'une
// ligne à l'autre et l'alignement, qui est tout l'intérêt, disparaît.
const COL_OP = "w-px py-1 pr-1 pl-4 text-center align-top select-none whitespace-nowrap";
const COL_MONTANT = "w-px py-1 pl-0 text-right align-top whitespace-nowrap tabular-nums";
// La colonne des libellés absorbe toute la place qui reste, et rien de plus :
// `max-w-0` avec `w-full` est ce qui force une colonne de tableau à céder devant
// ses voisines au lieu de pousser la table hors du panneau. Sans lui, un libellé
// long élargissait la table et les montants finissaient hors de vue, à chercher
// en faisant défiler de côté — dans un calcul, c'est le chiffre qu'on vient lire.
const COL_LIBELLE = "w-full max-w-0 py-1 align-top";

// Une ligne de l'opération : libellé (avec retrait et chevron dépliable), son
// opérateur, son montant. Cliquer la ligne la sélectionne (surbrillance ici et
// dans le grand tableau, qui glisse jusqu'à elle) si elle porte un ref ; sinon, si
// elle a des enfants, le clic la déplie.
function DetailRow({ row, premiere, selected, onToggle, onSelect }: {
  row: PanelRow;
  // Le premier terme de l'opération : il se pose sans symbole devant.
  premiere: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect?: () => void;
}) {
  const { node, depth, hasChildren, expanded } = row;
  const rowClick = onSelect ?? (hasChildren ? onToggle : undefined);
  return (
    <TableRow
      // data-selectable : marque les lignes qui pilotent la sélection. Un clic
      // ailleurs (hors de ces lignes) efface la surbrillance (voir DetailSidebarProvider).
      data-selectable={onSelect ? "" : undefined}
      className={cn(selected && HL, rowClick && "cursor-pointer")}
      onClick={rowClick}
    >
      <TableCell className={COL_LIBELLE}>
        <div className="flex items-start gap-1" style={{ paddingLeft: `${depth * 1}rem` }}>
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="text-muted-foreground mt-1 shrink-0"
              aria-label={expanded ? "Replier" : "Déplier"}
            >
              {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            </button>
          ) : (
            <span className="mt-1 inline-block size-3 shrink-0" />
          )}
          {/* Le libellé se coupe et le survol le rend entier. Un libellé bancaire
              n'a pas de longueur : « PRLV SEPA PAYPAL EUROPE S.A.R.L.-385261903… »
              poussait la colonne des chiffres hors du panneau, et un calcul dont on
              ne voit plus les montants ne sert à rien. Pas de clic pour déplier ici :
              le clic sur la ligne désigne déjà le montant dans le grand tableau. */}
          <div className="min-w-0 flex-1">
            <TruncatedText text={node.label} depliable={false} cote="left" />
          </div>
        </div>
      </TableCell>
      <TableCell className={cn(COL_OP, "text-muted-foreground")}>
        {symbolePose(node.amount, premiere)}
      </TableCell>
      <TableCell className={cn(COL_MONTANT, node.amount < 0 && "text-tension-encre")}>
        {fmtAbs(node.amount)}
      </TableCell>
    </TableRow>
  );
}

// Corps du détail : monté sous une clé liée au détail (voir plus bas), de sorte que
// l'état de dépliage (open) repart de zéro à chaque nouveau montant cliqué.

function DetailBody({ detail, onClose, selectedPanel, onSelectRow }: {
  detail: CellDetail;
  onClose: () => void;
  // Ligne du panneau actuellement active (identité propre : chemin de nœud ou TOTAL_ROW).
  selectedPanel?: string | null;
  // Sélection : (cases du tableau à surligner | null, identité de la ligne du panneau).
  // Plusieurs cases quand la ligne est une somme éclatée dans le tableau.
  onSelectRow?: (cells: string[] | null, panel: string) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (p: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  const rows = flattenNodes(detail.nodes, open);
  // Gestion d'un groupe : formulaires (renommer, montant, lignes, supprimer) au
  // lieu d'un calcul.
  if (detail.groupManage) {
    return <GroupManageBlock info={detail.groupManage} onClose={onClose} />;
  }
  // Gestion d'une ligne de récurrent : nom, jour, suppression. Aucun montant.
  if (detail.lineManage) {
    return <LineManageBlock info={detail.lineManage} onClose={onClose} />;
  }
  // Édition de la provision des non catégorisés : formulaire (montant daté) au lieu
  // d'un calcul.
  if (detail.uncatProvision) {
    return <UncatProvisionBlock info={detail.uncatProvision} onClose={onClose} />;
  }
  // Explication de colonne : titre + paragraphes de texte, sans chiffre ni calcul.
  if (detail.description) {
    return (
      <>
        <SidebarHeader className="gap-0 border-b p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-muted-foreground text-sm">Colonne</p>
              <h2 className="font-semibold">{detail.title}</h2>
            </div>
            <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1" aria-label="Fermer">
              <X className="size-4" />
            </button>
          </div>
        </SidebarHeader>
        <SidebarContent data-onboarding-target="amount-detail-panel" className="p-4">
          <div className="space-y-3 text-sm leading-relaxed">
            {detail.description.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </SidebarContent>
      </>
    );
  }
  return (
    <>
      <SidebarHeader className="gap-0 border-b p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-semibold">{detail.title}</h2>
            {detail.subtitle && <p className="text-muted-foreground text-sm">{detail.subtitle}</p>}
            <p className={cn("mt-1 text-lg font-semibold tabular-nums", detail.result < 0 && "text-tension-encre")}>{fmtSigned(detail.result)}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1" aria-label="Fermer">
            <X className="size-4" />
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent data-onboarding-target="amount-detail-panel" className="p-4">
        <Table>
          <TableBody>
            {rows.map((r, i) => {
              // Toute ligne est cliquable et surligne une ou plusieurs cases du
              // tableau : ses cases dédiées (refs) si son montant est une somme
              // éclatée dans le tableau, sinon sa case (ref), sinon la case d'origine
              // du détail (celle dont on montre le calcul). La ligne active du panneau
              // est identifiée par son propre chemin (r.path), donc cliquer une ligne
              // n'active jamais aussi la ligne « Total » — même si elles surlignent la
              // même case du tableau.
              const cells = cellsForNode(r.node, detail.cellRef);
              return (
                <DetailRow
                  key={r.path}
                  row={r}
                  premiere={i === 0}
                  selected={selectedPanel === r.path}
                  onToggle={() => toggle(r.path)}
                  onSelect={onSelectRow ? () => onSelectRow(cells, r.path) : undefined}
                />
              );
            })}
            {(() => {
              // Le total correspond à la case du tableau qui a ouvert ce détail
              // (cellRef) : la cliquer surligne cette case. Identité propre (TOTAL_ROW)
              // pour n'activer que cette ligne.
              const onTotal = onSelectRow ? () => onSelectRow(cellsForTotal(detail), TOTAL_ROW) : undefined;
              const totalSelected = selectedPanel === TOTAL_ROW;
              // Le trait de l'opération ne court que sous les chiffres, pas sous
              // les libellés : c'est le trait qu'on tire à la règle avant d'écrire
              // la somme, et il ne concerne que la colonne qu'on additionne.
              const TRAIT = "border-foreground/45 border-t";
              return (
                <TableRow
                  data-selectable={onTotal ? "" : undefined}
                  className={cn("font-semibold", totalSelected ? HL : "hover:bg-transparent", onTotal && "cursor-pointer")}
                  onClick={onTotal}
                >
                  <TableCell className={cn(COL_LIBELLE, "py-2")}>Total</TableCell>
                  <TableCell className={cn(COL_OP, TRAIT, "text-muted-foreground py-2")}>=</TableCell>
                  {/* La somme porte son signe COLLÉ au nombre, là où les termes le
                      portent dans leur colonne : c'est un résultat, pas un terme
                      qu'on ajoute. Sans lui, le panneau annonçait « 19,18 » sous un
                      titre à −19,18 — deux nombres pour la même chose. */}
                  <TableCell className={cn(COL_MONTANT, TRAIT, "py-2", detail.result < 0 && "text-tension-encre")}>
                    {`${symbolePose(detail.result, true)}${fmtAbs(detail.result)}`}
                  </TableCell>
                </TableRow>
              );
            })()}
          </TableBody>
        </Table>
        {/* Le dépassement de cette case, sous son calcul : c'est là qu'on se demande
            d'où vient le rouge. « Vu » retire le bandeau ET l'étiquette du tableau. */}
        {detail.overspendNotice && (
          <div className="mt-4">
            <OverspendNotice {...detail.overspendNotice} />
          </div>
        )}
        {/* Édition du montant sous la décomposition de la case « Budget dép. » : la
            décomposition reste visible, c'est elle qui dit d'où vient le chiffre. */}
        {detail.budgetEdit && <BudgetEditBlock info={detail.budgetEdit} />}
        {detail.note && <p className="text-muted-foreground mt-3 text-xs">{detail.note}</p>}
      </SidebarContent>
    </>
  );
}

// Sidebar shadcn côté droit : au-dessus de 1024 px elle pousse le contenu (comme la
// navigation de gauche) au lieu de le recouvrir ; en dessous elle s'ouvre par-dessus,
// faute de place pour deux colonnes et un tableau. Le contenu affiché vient de
// `detail` ; le glissement est piloté par le SidebarProvider qui l'englobe. La clé
// sur DetailBody réinitialise son état de dépliage à chaque nouveau détail.
export function HistoryDetailSidebar({ detail, onClose, selectedPanel, onSelectRow }: {
  detail: CellDetail | null;
  onClose: () => void;
  selectedPanel?: string | null;
  onSelectRow?: (cells: string[] | null, panel: string) => void;
}) {
  return (
    <Sidebar side="right" variant="inset" collapsible="offcanvas">
      {detail && (
        <DetailBody
          key={detailKey(detail)}
          detail={detail}
          onClose={onClose}
          selectedPanel={selectedPanel}
          onSelectRow={onSelectRow}
        />
      )}
    </Sidebar>
  );
}
