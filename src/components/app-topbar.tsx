"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, History, Settings, LogOut, User, ChevronDown } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { initiales } from "@/lib/account";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/app", label: "Tableau de bord", court: "Tableau", icon: LayoutDashboard },
  { href: "/app/transactions", label: "Transactions", court: "Transactions", icon: ArrowLeftRight },
  { href: "/app/historique", label: "Historique", court: "Historique", icon: History },
];

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
// Les réglages et la déconnexion restent sous le nom du compte : ce sont des
// choses qu'on fait à soi, pas des destinations.
export function AppTopbar({
  user,
  children,
}: {
  user: { name: string; email: string };
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <header className="bg-barre border-barre-filet flex h-14 shrink-0 items-center gap-1 border-b px-3 sm:gap-2 sm:px-4">
      <Link
        href="/app"
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
      <nav className="flex min-w-0 items-center gap-0.5">
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
                "flex h-9 items-center gap-2 rounded-lg px-2.5 text-[0.8125rem] font-semibold transition-colors duration-150 sm:px-3",
                active
                  ? "bg-sarcelle-voile text-sarcelle-encre"
                  : "text-barre-texte hover:bg-barre-appui hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden lg:inline">{n.label}</span>
              {/* Sur téléphone, seule la destination courante dit son nom : trois
                  libellés ne tiennent pas, et trois icônes muettes ne disent pas
                  où l'on est. */}
              <span className={cn("hidden sm:inline lg:hidden", active && "inline")}>{n.court}</span>
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
        {children}
        <DropdownMenu>
          <DropdownMenuTrigger className="text-barre-texte hover:bg-barre-appui hover:text-foreground data-[state=open]:bg-barre-appui data-[state=open]:text-foreground ml-0.5 flex max-w-44 cursor-pointer items-center gap-1.5 rounded-lg py-1 pr-1.5 pl-1 text-[0.8125rem] font-semibold transition-colors duration-150 sm:ml-1">
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
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/app/compte">
                <User />
                <span>Mon compte</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/app/settings">
                <Settings />
                <span>Réglages</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={async () => {
                await signOut();
                // refresh en plus de push : la porte de session vit dans un layout
                // serveur, qui ne se rejoue pas sur une simple navigation.
                router.push("/connexion");
                router.refresh();
              }}
            >
              <LogOut />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
