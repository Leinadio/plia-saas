"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BookOpen, Calculator, FlaskConical } from "lucide-react";
import { SpeedDial, type SpeedDialAction } from "@/components/ui/speed-dial";
import { useCalculatrice } from "@/components/calculatrice";
import { useNotificationsOptional } from "@/components/notifications-button";
import { useDemoExperienceOptional } from "@/components/demo-experience-provider";
import { isDemoMode } from "@/lib/onboarding-mode";
import { restartDemoGuide, toggleDemo } from "@/app/app/onboarding-actions";

// LES OUTILS, SUR TÉLÉPHONE. Démo, guide, calculatrice et dépassements ne sont
// pas des destinations : on les ouvre un instant et on les referme. En
// haut de l'écran ils prenaient la moitié d'une barre où il n'y a de place que
// pour se repérer. Ici ils tiennent sous le pouce, dans un seul rond, et la
// barre du haut redevient lisible.
//
// Sur grand écran ils restent dans la barre : la place y est, et un rond qui
// flotte au coin d'un écran large est une commande qu'on cherche.
export function OutilsFlottants() {
  const router = useRouter();
  const experience = useDemoExperienceOptional();
  const demo = experience ? isDemoMode(experience.mode) : false;
  const { ouverte, ouvrir, fermer, lignes } = useCalculatrice();
  const alertes = useNotificationsOptional();
  const [basculement, demarrerBascule] = useTransition();

  const actions: SpeedDialAction[] = [
    // Les dépassements en premier : c'est la commande la plus proche du pouce, et
    // la seule des quatre qui porte une nouvelle. En démonstration il n'y en a
    // pas, et la roue n'en compte alors que trois.
    ...(alertes
      ? [
          {
            key: "alertes",
            label: "Dépassements",
            icon: <Bell />,
            badge: alertes.restants,
            badgeTon: "tension" as const,
            action: alertes.ouvrir,
          },
        ]
      : []),
    {
      key: "calculatrice",
      label: "Calculatrice",
      icon: <Calculator />,
      active: ouverte,
      badge: lignes.length,
      action: () => (ouverte ? fermer() : ouvrir()),
    },
    {
      key: "guide",
      label: "Guide",
      icon: <BookOpen />,
      action: async () => {
        if (experience) {
          await experience.restart();
          return;
        }
        const resultat = await restartDemoGuide();
        router.push(resultat.destination);
        router.refresh();
      },
    },
    {
      key: "demo",
      label: demo ? "Quitter la démo" : "Démo",
      icon: <FlaskConical />,
      active: demo,
      disabled: basculement || experience?.saving,
      action: () => {
        demarrerBascule(async () => {
          try {
            await experience?.flush();
            await toggleDemo(!demo);
            router.refresh();
          } catch {
            // La démo affichée vient du serveur : une sauvegarde refusée ne la
            // remplace jamais par autre chose que ce qui est encore à l'écran.
          }
        });
      },
    },
  ];

  return (
    <SpeedDial
      direction="up"
      triggerLabel="Ouvrir les outils"
      actionButtons={actions}
      className="fixed right-4 bottom-4 z-40 sm:hidden"
    />
  );
}
