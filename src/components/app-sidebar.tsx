"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, History, Settings, ChevronsUpDown, LogOut, User } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/app", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/app/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/app/historique", label: "Historique", icon: History },
];

// La tête de la barre porte le compte connecté, et le lien de réglages a disparu de la
// navigation : les réglages sont une chose qu'on fait à son compte, pas un voisin du
// tableau de bord. Le nom et l'adresse viennent du serveur (le layout les tient de la
// session) plutôt que d'un appel côté navigateur, qui ferait clignoter un en-tête vide
// au premier rendu.
export function AppSidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <Sidebar variant="inset">
      {/* Le compte connecté juste sous le titre : c'est de là qu'on ouvre ses
          réglages et qu'on se déconnecte, deux gestes qui portent sur lui. */}
      <SidebarHeader className="gap-2">
        <div className="px-3 pt-1 text-base font-semibold">Budget</div>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="cursor-pointer">
                  <div className="flex min-w-0 flex-1 flex-col text-left leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              {/* side="right" : le menu s'ouvre à côté du nom et non par-dessus la
                  navigation, qui reste lisible. */}
              <DropdownMenuContent side="right" align="end" className="w-56">
                {/* Mon compte avant les réglages : l'un parle de la personne, l'autre
                    de ses banques. */}
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((n) => {
                const Icon = n.icon;
                const active = pathname === n.href;
                return (
                  <SidebarMenuItem key={n.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={n.label}>
                      <Link href={n.href}>
                        <Icon />
                        <span>{n.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
