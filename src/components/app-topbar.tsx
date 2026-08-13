"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, History, Settings, LogOut, User, ChevronDown } from "lucide-react";
import { signOut } from "@/lib/auth-client";
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

// La poutre. Toute l'app repose dessus : c'est la seule masse de carbone d'un
// écran de béton, et elle porte le nom, les trois destinations, et les deux
// gestes qu'on fait le plus souvent.
//
// Un bandeau et non plus une barre latérale : la structure de cette app se lit
// horizontalement, mois après mois, et une colonne de navigation prenait 16 rem
// à des tableaux qui en manquent. Les réglages et la déconnexion restent sous le
// nom du compte : ce sont des choses qu'on fait à soi, pas des destinations.
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
    <header className="bg-beam text-beam-foreground flex h-13 shrink-0 items-center gap-1 px-3 sm:gap-3 sm:px-4">
      <Link
        href="/app"
        className="font-display text-beam-bright mr-1 text-xl leading-none font-bold sm:mr-3"
      >
        Plia
      </Link>
      {/* Le filet vertical qui sépare le nom des destinations : une plaque
          d'appareillage sépare ses zones par un trait, pas par du vide. */}
      <span className="bg-beam-rule hidden h-6 w-px sm:block" />
      <nav className="flex min-w-0 items-center">
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
                "relative flex h-13 items-center gap-2 px-2.5 font-mono text-[0.6875rem] tracking-[0.1em] uppercase transition-colors sm:px-3.5",
                active
                  ? "text-beam-bright"
                  : "hover:text-beam-bright",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden lg:inline">{n.label}</span>
              {/* Sur téléphone, seule la destination courante dit son nom : trois
                  libellés ne tiennent pas, et trois icônes muettes ne disent pas
                  où l'on est. */}
              <span className={cn("hidden sm:inline lg:hidden", active && "inline")}>{n.court}</span>
              {/* Le repère d'appui : la destination courante porte le trait de
                  tension sous le pied, là où la charge passe. */}
              {active && <span className="bg-tension absolute inset-x-1.5 bottom-0 h-0.5" />}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {children}
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:text-beam-bright data-[state=open]:text-beam-bright flex max-w-40 cursor-pointer items-center gap-1.5 px-1.5 py-1 font-mono text-[0.6875rem] tracking-[0.08em] uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-tension">
            <User className="size-4 shrink-0" />
            <span className="hidden truncate md:inline">{user.name}</span>
            <ChevronDown className="size-3 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="border-border truncate border-b px-2 pt-1 pb-2 font-mono text-[0.6875rem] tracking-[0.04em]">
              {user.email}
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
