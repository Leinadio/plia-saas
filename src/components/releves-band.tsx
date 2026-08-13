import { formatEur } from "@/lib/money";
import { cn } from "@/lib/utils";

export type Releve = { label: string; valeur: number };

// LA BANDE DE RELEVÉS. Les mesures que le plan de charge dessine, écrites en
// clair : des cases séparées par un filet, jamais par du vide. Chaque case porte
// son étiquette gravée — la même pastille noire que les tables juste en dessous,
// parce que c'est le même rôle — et son montant à droite, en chasse fixe, pour
// que la rangée se lise comme une ligne de comptes.
export function RelevesBand({ releves }: { releves: Releve[] }) {
  const impair = releves.length % 2 === 1;
  return (
    <div
      className="plate grid grid-cols-2 lg:grid-cols-[repeat(var(--n),minmax(0,1fr))]"
      style={{ "--n": releves.length } as React.CSSProperties}
    >
      {releves.map((r, i) => (
        <div
          key={r.label}
          className={cn(
            "border-border flex min-w-0 flex-col gap-2 px-4 py-4 sm:px-5",
            i % 2 === 1 && "border-l lg:border-l",
            i >= 2 && "border-t lg:border-t-0",
            i >= 1 && "lg:border-l",
            // Un nombre impair de relevés laisse un orphelin sur téléphone :
            // le dernier prend alors toute la largeur plutôt que la moitié.
            impair && i === releves.length - 1 && "col-span-2 lg:col-span-1",
          )}
        >
          <span className="chip self-start">{r.label}</span>
          <span
            className={cn(
              // 18 px sur téléphone : à 24 px, « -2 342,80 € » ne tient pas dans
              // une demi-largeur d'écran de 390 px et se fait couper.
              "truncate text-right font-mono text-lg font-medium sm:text-xl lg:text-2xl",
              r.valeur < 0 && "text-tension-ink",
            )}
          >
            {formatEur(r.valeur)}
          </span>
        </div>
      ))}
    </div>
  );
}
