"use client";
import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight, History, Settings, LogOut, User, ChevronDown, RefreshCw, BookOpen } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { initiales } from "@/lib/account";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { useDemoExperienceOptional } from "@/components/demo-experience-provider";
import { isDemoMode } from "@/lib/onboarding-mode";
import { restartDemoGuide, toggleDemo } from "@/app/app/onboarding-actions";
import { Switch } from "@/components/ui/switch";

const NAV = [
  { href: "/app/historique", label: "Vue d’ensemble", court: "Vue", icon: History },
  { href: "/app/transactions", label: "Transactions", court: "Transactions", icon: ArrowLeftRight },
] as const;

// LA BARRE PRODUIT. Une surface blanche posée au-dessus du sol, séparée par un
// filet : elle surplombe, elle ne pèse pas. C'est l'inverse exact de la poutre de
// carbone d'avant, et c'est voulu — la navigation n'est pas le sujet de l'écran,
// les enveloppes le sont. Une masse noire en haut de chaque page prenait le
// premier regard pour une chose qu'on ne lit jamais.
//
// La destination courante se marque d'une pastille sarcelle pleine, pas d'un
// trait sous le pied : le trait est le repère des onglets DANS une page, et deux
// repères identiques à deux niveaux ne se distinguent plus.
//
// SUR TÉLÉPHONE, la barre ne garde que le repérage : la marque, les deux
// destinations, rafraîchir, le compte. Rien d'autre. Les outils — démo, guide,
// calculatrice, dépassements — descendent dans la roue flottante du coin bas droit
// (cf. outils-flottants.tsx), là où le pouce arrive. Et le menu du compte n'est
// plus un menu déroulant mais un panneau latéral : une liste de cinq lignes
// suspendue à un coin d'écran de téléphone se touche mal.
//
// Les réglages et la déconnexion restent sous le nom du compte : ce sont des
// choses qu'on fait à soi, pas des destinations.
export function AppTopbar({
  user,
  rafraichir,
  alertes,
  outils,
}: {
  user: { name: string; email: string };
  /** Le bouton Rafraîchir du mode réel. En démo, la barre en pose un factice. */
  rafraichir?: React.ReactNode;
  /** Le bouton Dépassements, sur grand écran seulement. */
  alertes?: React.ReactNode;
  /** La calculatrice, sur grand écran seulement. */
  outils?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const experience = useDemoExperienceOptional();
  const demo = experience ? isDemoMode(experience.mode) : false;
  const [switching, startSwitchTransition] = useTransition();

  // Les destinations du compte. Une seule liste, deux habillages : le menu
  // déroulant du grand écran et le panneau latéral du téléphone. En démo il n'y
  // a ni compte ni réglages à ouvrir — les données ne sont pas les vôtres.
  const destinationsCompte = demo
    ? []
    : [
        { href: "/app/compte", label: "Mon compte", icon: User },
        { href: "/app/settings", label: "Réglages", icon: Settings },
      ];

  const seDeconnecter = async () => {
    await signOut();
    // refresh en plus de push : la porte de session vit dans un layout
    // serveur, qui ne se rejoue pas sur une simple navigation.
    router.push("/connexion");
    router.refresh();
  };

  // En démo, rafraîchir ne demande rien à personne : le bouton est là pour que
  // le guide ait quelque chose à montrer, et il ne fait rien.
  const commandeRafraichir = demo ? (
    <button
      type="button"
      data-onboarding-target="refresh"
      aria-label="Actualiser les données de démonstration"
      title="Actualiser les données de démonstration"
      className="text-barre-texte border-filet bg-barre-appui flex size-9 shrink-0 cursor-default items-center justify-center rounded-lg border"
    >
      <RefreshCw className="size-4" aria-hidden />
    </button>
  ) : (
    rafraichir
  );

  return (
    <header
      // Sur téléphone la barre se plie en deux étages : le repérage en haut, les
      // destinations en dessous. Il leur faut de l'air entre eux — collés, les
      // deux lignes se lisent comme un seul bloc et le nom de la marque touche
      // l'onglet actif. D'où la respiration verticale, qui n'existe qu'ici : sur
      // grand écran tout tient sur une seule ligne de 56 px.
      className="bg-barre border-barre-filet grid min-h-14 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-y-2.5 border-b px-3 py-2.5 sm:flex sm:h-14 sm:gap-2 sm:gap-y-0 sm:px-4 sm:py-0"
      data-header-row="actions"
    >
      <Link
        href="/app/historique"
        className="mr-1 flex items-center gap-2 rounded-lg py-1 pr-1 sm:mr-2"
      >
        {/* La marque : un carré d'encre aux coins arrondis, et le pli du nom
            dedans. Un logotype de logiciel de travail se reconnaît petit, dans un
            onglet de navigateur comme au coin d'une barre. */}
        <span
          aria-hidden
          className="bg-encre text-[var(--surface)] flex size-7 items-center justify-center rounded-lg text-sm font-bold"
        >
          P
        </span>
        <span className="text-foreground text-lg leading-none font-bold tracking-[-0.02em]">
          Plia
        </span>
      </Link>
      <nav
        className="col-span-3 row-start-2 grid grid-cols-2 gap-1 sm:flex sm:min-w-0 sm:items-center sm:gap-0.5"
        data-header-row="navigation"
      >
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              title={n.label}
              className={cn(
                "flex h-9 w-full items-center justify-center gap-2 rounded-lg px-2.5 text-[0.8125rem] font-semibold transition-colors duration-150 sm:w-auto sm:px-3",
                active
                  ? "bg-sarcelle-voile text-sarcelle-encre"
                  : "text-barre-texte hover:bg-barre-appui hover:text-foreground",
              )}
            >
              <Icon className="hidden size-4 shrink-0 sm:block" />
              <span className="hidden lg:inline">{n.label}</span>
              <span className="sm:hidden">{n.label}</span>
              <span className="hidden sm:inline lg:hidden">{n.court}</span>
            </Link>
          );
        })}
      </nav>
      <div className="col-start-3 row-start-1 flex items-center justify-end gap-1 sm:ml-auto">
        {/* Les outils du grand écran. Sur téléphone ils vivent dans la roue
            flottante, et cette zone n'existe pas. */}
        <div data-header-actions-desktop className="hidden items-center gap-0.5 sm:flex">
          <div className="text-barre-texte flex h-9 items-center gap-1.5 rounded-lg px-1.5 text-[0.75rem] font-semibold sm:px-2">
            <span>Démo</span>
            <Switch
              aria-label="Activer la démonstration"
              checked={demo}
              disabled={switching || experience?.saving}
              onCheckedChange={(checked) => {
                startSwitchTransition(async () => {
                  try {
                    await experience?.flush();
                    await toggleDemo(checked);
                    router.refresh();
                  } catch {
                    // Le switch reste contrôlé par l'état serveur : une sauvegarde
                    // refusée ne remplace donc jamais la démo encore visible.
                  }
                });
              }}
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              if (experience) {
                await experience.restart();
                return;
              }
              const result = await restartDemoGuide();
              router.push(result.destination);
              router.refresh();
            }}
            className="text-barre-texte hover:bg-barre-appui hover:text-foreground flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[0.8125rem] font-semibold transition-colors duration-150"
          >
            <BookOpen className="size-4" aria-hidden />
            <span>Guide</span>
          </button>
          {outils}
          {alertes}
        </div>
        {/* Rafraîchir, juste à gauche du compte, aux deux tailles d'écran : c'est
            le geste qu'on refait le plus souvent, il ne se range pas. */}
        {commandeRafraichir}
        {/* LE COMPTE. Menu déroulant sur grand écran, panneau latéral sur
            téléphone : même contenu, deux gestes différents parce que la main
            n'est pas la même. */}
        <DropdownMenu>
          <DropdownMenuTrigger className="text-barre-texte hover:bg-barre-appui hover:text-foreground data-[state=open]:bg-barre-appui data-[state=open]:text-foreground ml-0.5 hidden max-w-44 cursor-pointer items-center gap-1.5 rounded-lg py-1 pr-1.5 pl-1 text-[0.8125rem] font-semibold transition-colors duration-150 sm:ml-1 sm:flex">
            {/* Les initiales plutôt qu'une icône : c'est le seul endroit de l'écran
                où quelque chose désigne une personne, et une silhouette générique
                ne désigne personne. */}
            <span
              aria-hidden
              className="bg-creuse text-foreground border-filet flex size-7 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-bold"
            >
              {initiales(user.name)}
            </span>
            <span className="hidden truncate md:inline">{user.name}</span>
            <ChevronDown className="size-3.5 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="border-filet mb-1 truncate border-b px-2 pt-1 pb-2">
              <p className="truncate text-[0.8125rem] font-semibold">{user.name}</p>
              <p className="text-muted-foreground truncate text-xs">{user.email}</p>
            </div>
            {destinationsCompte.length > 0 && (
              <>
                {destinationsCompte.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} asChild className="cursor-pointer">
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem className="cursor-pointer" onClick={seDeconnecter}>
              <LogOut />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Sheet>
          <SheetTrigger
            aria-label="Ouvrir le menu du compte"
            className="text-barre-texte data-[state=open]:bg-barre-appui ml-0.5 flex shrink-0 cursor-pointer items-center rounded-lg p-1 transition-colors duration-150 sm:hidden"
          >
            <span
              aria-hidden
              className="bg-creuse text-foreground border-filet flex size-7 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-bold"
            >
              {initiales(user.name)}
            </span>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 gap-0 sm:max-w-sm">
            <SheetHeader className="border-b">
              <SheetTitle className="truncate">{user.name}</SheetTitle>
              <SheetDescription className="truncate">{user.email}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-1 p-3">
              {destinationsCompte.map(({ href, label, icon: Icon }) => (
                <SheetClose asChild key={href}>
                  <Link
                    href={href}
                    className="text-foreground hover:bg-barre-appui flex h-11 items-center gap-2.5 rounded-lg px-2.5 text-sm font-semibold transition-colors duration-150"
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span>{label}</span>
                  </Link>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <button
                  type="button"
                  onClick={seDeconnecter}
                  className="text-foreground hover:bg-barre-appui flex h-11 items-center gap-2.5 rounded-lg px-2.5 text-sm font-semibold transition-colors duration-150"
                >
                  <LogOut className="size-4 shrink-0" aria-hidden />
                  <span>Se déconnecter</span>
                </button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
