import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// --- LES SQUELETTES ----------------------------------------------------------
// Ce que chaque écran montre pendant qu'il se calcule. Toutes les pages de l'app
// sont dynamiques et lisent la base à chaque visite : entre le clic et l'arrivée
// des chiffres il y a une seconde, parfois deux. Sans rien à l'écran, ce temps se
// vit comme une panne — l'ancienne page reste figée, on reclique, rien ne bouge.
//
// La règle est la même partout : le squelette dessine la STRUCTURE réelle de la
// page, à la bonne place et à la bonne largeur, pas une grappe de rectangles
// génériques. Ce qui arrive ensuite ne doit rien déplacer : on remplit un plan
// déjà tiré, on ne redessine pas l'écran.
//
// Ces composants n'ont ni état ni interaction : ils restent des composants
// serveur, rendus avec la page qui les demande (les fichiers loading.tsx).

const rangees = (n: number) => Array.from({ length: n }, (_, i) => i);

// --- Historique ---------------------------------------------------------------

// Le grand tableau tel qu'il se présente : une épine large à gauche, puis des
// blocs de mois de huit colonnes. Trois mois, c'est ce que la page affiche par
// défaut ; les colonnes qui débordent sont coupées comme dans le vrai tableau.
const MOIS_PAR_DEFAUT = 3;
const COLONNES_PAR_MOIS = 8;

function LigneDeTableau({ nom, fond }: { nom: string; fond?: string }) {
  return (
    <div className={cn("border-border/70 flex items-center border-b px-3 py-2.5", fond)}>
      <div className="w-44 shrink-0 sm:w-80">
        <Skeleton className={cn("h-3.5", nom)} />
      </div>
      {rangees(MOIS_PAR_DEFAUT).map((m) => (
        <div key={m} className="border-border/70 flex shrink-0 gap-3 border-l pr-3 pl-4">
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
    <div className={cn("border-border/70 flex items-center border-b px-3 py-2", fond)}>
      <div className="w-44 shrink-0 sm:w-80">
        <Skeleton className={cn("h-3", largeur)} />
      </div>
    </div>
  );
}

export function SqueletteHistorique() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      {/* Les onglets de comptes. */}
      <div className="flex gap-1">
        {rangees(2).map((i) => (
          <Skeleton key={i} className="cut cut-sm h-9 w-32" />
        ))}
      </div>

      {/* Le bouton d'explication du calcul, à droite comme sur la page. */}
      <div className="flex justify-end">
        <Skeleton className="cut cut-sm h-9 w-40" />
      </div>

      {/* La frise des mois : ses deux bornes, ses flèches, ses cases.
          min-w-0 : un élément de flex refuse par défaut de descendre sous la
          largeur de son contenu, et la frise pousserait alors toute la page hors
          de l'écran sur téléphone. */}
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton className="h-10 w-24 shrink-0" />
        <Skeleton className="size-7 shrink-0" />
        <div className="flex min-w-0 flex-1 justify-center gap-px overflow-hidden">
          {rangees(16).map((i) => (
            <Skeleton key={i} className="h-7 w-10 shrink-0" />
          ))}
        </div>
        <Skeleton className="size-7 shrink-0" />
        <Skeleton className="h-10 w-24 shrink-0" />
      </div>

      <Skeleton className="h-3.5 w-56" />

      {/* LA PLAQUE. La même que celle du tableau, aux mêmes angles coupés : le
          vrai tableau vient s'y poser sans que la page bouge d'un pixel. */}
      <div className="plate min-w-0 [--notch:14px] overflow-hidden p-px">
        {/* L'en-tête de colonnes. */}
        <div className="border-border flex items-end border-b px-3 py-2.5">
          <div className="w-44 shrink-0 sm:w-80" />
          {rangees(MOIS_PAR_DEFAUT).map((m) => (
            <div key={m} className="border-border flex shrink-0 flex-col gap-2 border-l pr-3 pl-4">
              <Skeleton className="h-3.5 w-28" />
              <div className="flex gap-3">
                {rangees(COLONNES_PAR_MOIS).map((c) => (
                  <Skeleton key={c} className="h-2.5 w-14" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <BandeDeSection largeur="w-32" fond="bg-[color-mix(in_oklab,var(--portant)_10%,var(--background))]" />
        <LigneDeTableau nom="w-28" />
        <LigneDeTableau nom="w-36" />

        <BandeDeSection largeur="w-40" fond="bg-[color-mix(in_oklab,var(--tension)_7%,var(--background))]" />
        <LigneDeTableau nom="w-24" />
        <LigneDeTableau nom="w-40" />
        <LigneDeTableau nom="w-32" />
        <LigneDeTableau nom="w-28" />

        <BandeDeSection largeur="w-48" fond="bg-[color-mix(in_oklab,var(--tension)_7%,var(--background))]" />
        <LigneDeTableau nom="w-36" />

        {/* Le pied de carbone : les totaux et le solde de fin de mois. C'est la
            masse la plus reconnaissable du tableau, elle doit être là. */}
        <div className="bg-carbon">
          {rangees(2).map((i) => (
            <div key={i} className="flex items-center px-3 py-3">
              <div className="w-44 shrink-0 sm:w-80">
                <Skeleton className="h-3 w-32 bg-[color-mix(in_oklab,var(--void-white)_22%,var(--carbon))]" />
              </div>
              {rangees(MOIS_PAR_DEFAUT).map((m) => (
                <div key={m} className="flex shrink-0 gap-3 pr-3 pl-4">
                  {rangees(COLONNES_PAR_MOIS).map((c) => (
                    <Skeleton
                      key={c}
                      className="h-3 w-14 bg-[color-mix(in_oklab,var(--void-white)_22%,var(--carbon))]"
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Tableau de bord ----------------------------------------------------------

export function SqueletteTableauDeBord() {
  // Des hauteurs de mâts fixes et volontairement inégales : six barres de la
  // même hauteur ressembleraient à un histogramme vide, pas à une structure en
  // cours de montage.
  const mats = [58, 74, 46, 88, 62, 36];
  return (
    <div aria-busy className="mx-auto flex max-w-[1400px] flex-col gap-4">
      {/* Le plan de charge. */}
      <section className="plate px-3 py-4 sm:px-5 sm:py-5">
        <div className="min-w-0 overflow-hidden">
          <div className="grid grid-cols-6 gap-3">
            {mats.map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-2.5 w-10" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
          {/* Le sol, et les mâts qui s'y appuient. La zone de dessin est bornée en
              haut ET en bas : sans hauteur résolue, la hauteur en pourcentage des
              mâts vaudrait zéro et il ne resterait que le trait du sol. */}
          <div className="relative mt-4 h-44 sm:h-56">
            <div className="absolute inset-x-0 top-0 bottom-6 grid grid-cols-6 items-end gap-3">
              {mats.map((h, i) => (
                <div key={i} className="flex h-full items-end justify-center">
                  <Skeleton className="w-[3px]" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div className="bg-rule-strong absolute inset-x-0 bottom-6 h-px" />
          </div>
        </div>
      </section>

      {/* La bande de relevés : cinq mesures séparées par un filet. */}
      <div className="plate grid grid-cols-2 lg:grid-cols-5">
        {rangees(5).map((i) => (
          <div
            key={i}
            className={cn(
              "border-border flex min-w-0 flex-col gap-3 px-4 py-4 sm:px-5",
              i % 2 === 1 && "border-l",
              i >= 2 && "border-t lg:border-t-0",
              i >= 1 && "lg:border-l",
              i === 4 && "col-span-2 lg:col-span-1",
            )}
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-full max-w-32 self-end" />
          </div>
        ))}
      </div>

      {/* Les deux tables du mois : ce qui porte, ce qui tire. */}
      <div className="grid gap-4 xl:grid-cols-2">
        {rangees(2).map((t) => (
          <section key={t} className="plate flex min-w-0 flex-col px-3 py-4 sm:px-5">
            <Skeleton className="h-4 w-20" />
            <div className="border-rule-strong mt-4 flex items-center gap-4 border-b pb-1.5">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="ml-auto h-2.5 w-14" />
              <Skeleton className="h-2.5 w-14" />
            </div>
            {rangees(5).map((i) => (
              <div key={i} className="border-border/70 flex items-center gap-4 border-b py-2.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="ml-auto h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

// --- Transactions -------------------------------------------------------------

export function SqueletteTransactions() {
  return (
    <div aria-busy className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Skeleton className="cut cut-sm h-9 w-44" />
      </div>

      {/* Le pupitre de filtres. */}
      <div className="plate flex flex-wrap items-center gap-2 px-3 py-3">
        <Skeleton className="h-9 w-full sm:w-56" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Le relevé, groupé par mois. */}
      <div className="plate overflow-hidden">
        {rangees(2).map((mois) => (
          <div key={mois}>
            <div className="bg-muted/70 border-border flex items-center gap-2 border-b px-3 py-2.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            {rangees(6).map((i) => (
              <div key={i} className="border-border/70 flex items-center gap-4 border-b px-3 py-3">
                <Skeleton className="h-3 w-16 shrink-0" />
                <Skeleton className="h-3.5 w-full max-w-72 min-w-0" />
                <Skeleton className="hidden h-3 w-32 shrink-0 sm:block" />
                {/* Le montant est collé à droite, comme dans le relevé : c'est la
                    colonne qu'on lit, et elle s'aligne sur le bord de la plaque. */}
                <Skeleton className="ml-auto h-3 w-20 shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Écrans de réglages -------------------------------------------------------

// Réglages et Mon compte : des plaques empilées, chacune avec son titre gravé et
// quelques champs. Le même squelette suffit aux deux — ils ont la même forme.
export function SquelettePlaques({ nombre = 3 }: { nombre?: number }) {
  return (
    <div aria-busy className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {rangees(nombre).map((i) => (
        <section key={i} className="plate flex flex-col gap-4 px-4 py-5 sm:px-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3.5 w-full max-w-md" />
          <div className="flex flex-wrap items-end gap-2">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="cut cut-sm h-9 w-28" />
          </div>
        </section>
      ))}
    </div>
  );
}
