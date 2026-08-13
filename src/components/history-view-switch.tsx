"use client";
import { useRouter } from "next/navigation";
import { COOKIE_VUE, type VueHistorique } from "@/lib/history-view";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Le choix de vue s'écrit dans un cookie que le serveur relit au rendu suivant :
// c'est ce qui évite d'afficher d'abord la mauvaise vue puis de basculer sous les
// yeux de l'utilisateur. router.refresh() redemande la page au serveur sans
// recharger l'onglet, donc sans perdre le défilement.
export function HistoryViewSwitch({ vue }: { vue: VueHistorique }) {
  const router = useRouter();
  const choisir = (v: string) => {
    // Un an : le choix est une préférence, pas une session.
    document.cookie = `${COOKIE_VUE}=${v}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  };
  return (
    <Tabs value={vue} onValueChange={choisir}>
      <TabsList>
        <TabsTrigger value="simple">Simple</TabsTrigger>
        <TabsTrigger value="tableau">Tableau</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
