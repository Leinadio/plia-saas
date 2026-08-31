import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// --- LES SQUELETTES ----------------------------------------------------------
// Ce que chaque écran montre pendant qu'il se calcule. Toutes les pages de l'app
// sont dynamiques et lisent la base à chaque visite : entre le clic et l'arrivée
// des chiffres il y a une seconde, parfois deux. Sans rien à l'écran, ce temps se
// vit comme une panne — l'ancienne page reste figée, on reclique, rien ne bouge.
//
// La règle est la même partout : le squelette dessine la STRUCTURE réelle de la
// page — les mêmes cartes, aux mêmes places, aux mêmes largeurs — pas une grappe
// de rectangles génériques. Ce qui arrive ensuite ne doit rien déplacer : on
// remplit un plan déjà tiré, on ne redessine pas l'écran.
//
// Ces composants n'ont ni état ni interaction : ils restent des composants
// serveur, rendus avec la page qui les demande (les fichiers loading.tsx).

const rangees = (n: number) => Array.from({ length: n }, (_, i) => i);

// Les onglets de comptes, en tête de l'Historique comme des Transactions.
function Onglets() {
  return (
    <div className="border-filet flex gap-3 border-b pb-2">
      {rangees(2).map((i) => (
        <Skeleton key={i} className="h-4 w-28" />
      ))}
    </div>
  );
}

// UNE LIGNE DE POSTE : son nom, son montant à droite, sa jauge, et le détail en
// petit dessous. Le dessin exact d'une enveloppe.
function LignePoste({ nom }: { nom: string }) {
  return (
    <div className="border-filet flex flex-col gap-2.5 border-b px-4 py-3 last:border-0 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className={cn("h-3.5", nom)} />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-20" />
      </div>
      <Skeleton className="h-1.5 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  );
}

// --- Historique ---------------------------------------------------------------

// Le grand tableau tel qu'il se présente : une épine large à gauche, puis des
// blocs de mois de huit colonnes. Trois mois, c'est ce que la page affiche par
// défaut ; les colonnes qui débordent sont coupées comme dans le vrai tableau.
const MOIS_PAR_DEFAUT = 3;
const COLONNES_PAR_MOIS = 8;

function LigneDeTableau({ nom, fond }: { nom: string; fond?: string }) {
  return (
    <div className={cn("border-filet flex items-center border-b px-3 py-2.5", fond)}>
      <div className="w-44 shrink-0 sm:w-80">
        <Skeleton className={cn("h-3.5", nom)} />
      </div>
      {rangees(MOIS_PAR_DEFAUT).map((m) => (
        <div key={m} className="border-filet flex shrink-0 gap-3 border-l pr-3 pl-4">
          {rangees(COLONNES_PAR_MOIS).map((c) => (
            <Skeleton key={c} className="h-3 w-14" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Un bandeau de section : son nom occupe l'épine, les colonnes restent vides,
// exactement comme dans le tableau.
function BandeDeSection({ largeur, fond }: { largeur: string; fond: string }) {
  return (
    <div className={cn("border-filet flex items-center border-b px-3 py-2", fond)}>
      <div className="w-44 shrink-0 sm:w-80">
        <Skeleton className={cn("h-3", largeur)} />
      </div>
    </div>
  );
}

// Le tableau seul. Il sert aussi quand l'utilisateur change de période : la
// frise reste visible avec son nouveau choix, seule la zone qui recalcule attend.
export function SqueletteGrilleHistorique() {
  return (
    <div data-history-table-skeleton="" aria-busy className="carte min-w-0 overflow-hidden">
      <div className="border-filet flex items-end border-b px-3 py-2.5">
        <div className="w-44 shrink-0 sm:w-80" />
        {rangees(MOIS_PAR_DEFAUT).map((m) => (
          <div key={m} className="border-filet flex shrink-0 flex-col gap-2 border-l pr-3 pl-4">
            <Skeleton className="h-3.5 w-28" />
            <div className="flex gap-3">
              {rangees(COLONNES_PAR_MOIS).map((c) => (
                <Skeleton key={c} className="h-2.5 w-14" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <BandeDeSection largeur="w-32" fond="bg-[color-mix(in_oklab,var(--portant)_7%,var(--card))]" />
      <LigneDeTableau nom="w-28" />
      <LigneDeTableau nom="w-36" />

      <BandeDeSection largeur="w-40" fond="bg-[color-mix(in_oklab,var(--tension)_5%,var(--card))]" />
      <LigneDeTableau nom="w-24" />
      <LigneDeTableau nom="w-40" />
      <LigneDeTableau nom="w-32" />
      <LigneDeTableau nom="w-28" />

      <BandeDeSection largeur="w-48" fond="bg-[color-mix(in_oklab,var(--tension)_5%,var(--card))]" />
      <LigneDeTableau nom="w-36" />

      <div className="bg-encre">
        {rangees(2).map((i) => (
          <div key={i} className="flex items-center px-3 py-3">
            <div className="w-44 shrink-0 sm:w-80">
              <Skeleton className="h-3 w-32 bg-[color-mix(in_oklab,var(--surface)_22%,var(--encre))]" />
            </div>
            {rangees(MOIS_PAR_DEFAUT).map((m) => (
              <div key={m} className="flex shrink-0 gap-3 pr-3 pl-4">
                {rangees(COLONNES_PAR_MOIS).map((c) => (
                  <Skeleton
                    key={c}
                    className="h-3 w-14 bg-[color-mix(in_oklab,var(--surface)_22%,var(--encre))]"
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SqueletteHistorique() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <Onglets />

      {/* Le bouton d'explication du calcul, à droite comme sur la page. */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-44 rounded-lg" />
      </div>

      {/* La frise des mois, dans sa carte : ses deux bornes, ses flèches, ses
          cases. min-w-0 : un élément de flex refuse par défaut de descendre sous la
          largeur de son contenu, et la frise pousserait alors toute la page hors de
          l'écran sur téléphone. */}
      <div className="carte flex min-w-0 items-center gap-3 px-3 py-3 sm:px-4">
        <Skeleton className="hidden h-8 w-20 shrink-0 sm:block" />
        <Skeleton className="size-8 shrink-0 rounded-md" />
        <div className="flex min-w-0 flex-1 justify-center gap-0.5 overflow-hidden">
          {rangees(14).map((i) => (
            <Skeleton key={i} className="h-8 w-11 shrink-0 rounded-md" />
          ))}
        </div>
        <Skeleton className="size-8 shrink-0 rounded-md" />
        <Skeleton className="hidden h-8 w-20 shrink-0 sm:block" />
      </div>

      <Skeleton className="h-3.5 w-56" />

      {/* LA CARTE. La même que celle du tableau : le vrai tableau vient s'y poser
          sans que la page bouge d'un pixel. */}
      <SqueletteGrilleHistorique />
    </div>
  );
}

// --- Tableau de bord ----------------------------------------------------------

export function SqueletteTableauDeBord() {
  // Des hauteurs de colonnes fixes et volontairement inégales : six barres de la
  // même hauteur ressembleraient à un histogramme vide, pas à une trajectoire en
  // cours d'arrivée.
  const colonnes = [58, 74, 46, 88, 62, 36];
  return (
    <div aria-busy className="mx-auto flex max-w-[1400px] flex-col gap-3">
      {/* L'horizon. */}
      <section className="carte overflow-hidden">
        <div className="border-filet flex items-center gap-3 border-b px-4 py-3 sm:px-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-72 max-w-[50%]" />
        </div>
        <div className="px-3 pt-4 pb-3 sm:px-5">
          <div className="grid grid-cols-6 gap-1 sm:gap-3">
            {colonnes.map((_, i) => (
              <Skeleton key={i} className="h-3.5 w-full max-w-20 justify-self-center" />
            ))}
          </div>
          {/* La zone de dessin est bornée en haut ET en bas : sans hauteur résolue,
              la hauteur en pourcentage des colonnes vaudrait zéro et il ne resterait
              que le trait du sol. */}
          <div className="relative mt-3 h-36 sm:h-48">
            <div className="absolute inset-x-0 top-0 bottom-0 grid grid-cols-6 items-end gap-1 sm:gap-3">
              {colonnes.map((h, i) => (
                <div key={i} className="flex h-full items-end justify-center">
                  <Skeleton
                    className="w-[min(2.25rem,70%)] rounded-t-md rounded-b-none"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="bg-filet-fort absolute inset-x-0 bottom-0 h-px" />
          </div>
          <div className="border-filet mt-2 grid grid-cols-6 gap-1 border-t pt-2 sm:gap-3">
            {colonnes.map((_, i) => (
              <Skeleton key={i} className="h-3 w-full max-w-14 justify-self-center" />
            ))}
          </div>
        </div>
      </section>

      {/* Les relevés : la mesure de tête, puis les quatre mesures d'appui. */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <section className="carte flex flex-col justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-3 w-full max-w-sm" />
        </section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {rangees(4).map((i) => (
            <section key={i} className="carte flex flex-col gap-2 px-3 py-3 sm:px-4">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-4 w-24" />
            </section>
          ))}
        </div>
      </div>

      {/* Les deux cartes de postes du mois : ce qui rentre, ce qui sort. */}
      <div className="grid gap-3 xl:grid-cols-2">
        {rangees(2).map((t) => (
          <div key={t} className="carte overflow-hidden">
            <div className="border-filet flex items-center justify-between border-b px-4 py-3 sm:px-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            {rangees(4).map((i) => (
              <LignePoste key={i} nom={i % 2 === 0 ? "w-32" : "w-24"} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Transactions -------------------------------------------------------------

export function SqueletteTransactions() {
  return (
    <div aria-busy className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-48 rounded-lg" />
      </div>

      {/* Le pupitre de filtres. */}
      <div className="carte flex flex-wrap items-center gap-2 px-3 py-3 sm:px-4">
        <Skeleton className="h-9 w-full rounded-lg sm:w-64" />
        <Skeleton className="h-9 w-44 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      <Onglets />

      {/* Le relevé, une carte par mois. */}
      {rangees(2).map((mois) => (
        <div key={mois} className="carte overflow-hidden">
          <div className="border-filet flex items-center gap-3 border-b px-4 py-3 sm:px-5">
            <Skeleton className="size-4 rounded-md" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
          {rangees(5).map((i) => (
            <div key={i} className="border-filet flex flex-col gap-2 border-b px-4 py-3 last:border-0 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Skeleton className="h-3 w-12 shrink-0" />
                  <Skeleton className="h-3.5 w-full max-w-64 min-w-0" />
                </div>
                <Skeleton className="h-3.5 w-20 shrink-0" />
              </div>
              <Skeleton className="h-8 w-52 rounded-lg" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// --- Écrans de réglages -------------------------------------------------------

// Réglages et Mon compte : des cartes empilées, chacune avec son titre et quelques
// champs. Le même squelette suffit aux deux — ils ont la même forme.
export function SquelettePlaques({ nombre = 3 }: { nombre?: number }) {
  return (
    <div aria-busy className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      {rangees(nombre).map((i) => (
        <section key={i} className="carte overflow-hidden">
          <div className="border-filet border-b px-4 py-3 sm:px-5">
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
            <Skeleton className="h-3.5 w-full max-w-md" />
            <div className="flex flex-wrap items-end gap-2">
              <Skeleton className="h-9 w-56 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
