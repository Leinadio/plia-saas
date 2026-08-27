import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEur } from "@/lib/money";
import { Jauge, JaugeEntree } from "@/components/jauge";
import { MontantAttrapable } from "@/components/montant-attrapable";

export type LignePoste = {
  id: number;
  nom: string;
  montants: number[];
  // Les quatre états du produit : acquis et engagé portent, attendu dort,
  // dépassé a rompu. Ce sont les mêmes mots partout dans l'app.
  etat: "acquis" | "attendu" | "engagé" | "dépassé";
};

const PASTILLE: Record<LignePoste["etat"], string> = {
  acquis: "pastille-portant",
  engagé: "",
  attendu: "pastille-attente",
  dépassé: "pastille-tension",
};

// LES POSTES D'UN SENS, EN CARTE. Une ligne par poste, et chaque ligne est une
// enveloppe : son nom et son état à gauche, le chiffre qui compte à droite, la
// jauge en dessous, et sous elle le détail en petit.
//
// Ce n'était pas une table déguisée qu'il fallait : les colonnes « Enveloppe /
// Dépensé / Reste » côte à côte obligeaient à comparer trois nombres pour savoir
// où en était un poste, et sur téléphone deux d'entre elles disparaissaient. Ici
// c'est la jauge qui répond en premier — pleine, entamée, ou débordée — et les
// trois nombres ne font que la confirmer.
//
// LE CHIFFRE DE DROITE EST LE DERNIER DE LA LISTE : le reste pour une sortie, le
// reçu pour une entrée. C'est celui pour lequel on ouvre l'app.
export function CartePostes({
  titre,
  sens,
  lignes,
  vide,
  colonnes,
}: {
  titre: string;
  // Le sens décide du dessin de la jauge : une sortie peut déborder de son
  // enveloppe, une entrée ne déborde jamais — un trop-perçu n'est pas une
  // rupture.
  sens: "entrees" | "sorties";
  lignes: LignePoste[];
  vide: string;
  // Les noms des montants, dans leur ordre. Ils servent aux légendes du détail
  // et au libellé qu'un montant emporte dans la calculatrice.
  colonnes: string[];
}) {
  // Le dernier pas de l'histoire. Voir qu'une enveloppe a débordé ne sert à rien
  // si rien ne dit où l'on va la corriger : c'est dans l'Historique, poste par
  // poste et mois par mois. Un lien en tête de carte, et non un geste par ligne —
  // une ligne qui s'allumerait au survol promettrait un clic qui n'existe pas.
  const total = lignes.reduce((s, l) => s + l.montants[l.montants.length - 1], 0);

  return (
    <section className="carte flex min-w-0 flex-col">
      <div className="border-filet flex items-baseline justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <h2 className="titre-carte">{titre}</h2>
        <div className="flex items-baseline gap-4">
          {lignes.length > 0 && (
            <p className="flex items-baseline gap-2">
              <span className="legende">{colonnes[colonnes.length - 1]}</span>
              <span className={cn("montant text-[0.9375rem]", total < 0 && "text-tension-encre")}>
                {formatEur(total)}
              </span>
            </p>
          )}
          <Link
            href="/app/historique"
            className="text-sarcelle-encre hover:bg-sarcelle-voile -mx-1.5 flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.8125rem] font-semibold transition-colors"
          >
            Ajuster
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {lignes.length === 0 ? (
        <p className="text-muted-foreground px-4 py-8 text-center text-sm sm:px-5">{vide}</p>
      ) : (
        <ul className="divide-filet divide-y">
          {lignes.map((l) => {
            const dernier = l.montants[l.montants.length - 1];
            // Une sortie porte [enveloppe, dépensé (négatif), reste] ; une entrée
            // porte [prévu, reçu]. Le dépensé arrive signé, la jauge le veut en
            // valeur absolue.
            const budget = l.montants[0];
            const consomme = sens === "sorties" ? -l.montants[1] : l.montants[1];
            return (
              // Pas de survol sur cette ligne : elle ne mène nulle part et ne
              // porte aucune commande. Un fond qui s'allume au passage promet un
              // geste, et il n'y en a pas ici — c'est dans l'Historique qu'on
              // corrige un poste (cf. le lien en tête de carte).
              <li key={l.id} className="px-4 py-3 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="min-w-0 truncate text-sm font-semibold" lang="fr">
                      {l.nom}
                    </span>
                    <span className={cn("pastille", PASTILLE[l.etat])}>{l.etat}</span>
                  </div>
                  {/* Chaque montant s'attrape et se tire dans la calculatrice de
                      brouillon, avec le nom de son poste et celui de sa colonne :
                      « Courses · Reste » se lit tout seul une fois là-bas. */}
                  <span
                    className={cn(
                      "montant shrink-0 text-sm",
                      dernier < 0 && "text-tension-encre",
                      dernier === 0 && "text-ardoise-claire",
                    )}
                  >
                    <MontantAttrapable
                      libelle={`${l.nom} · ${colonnes[colonnes.length - 1]}`}
                      montant={dernier}
                    />
                  </span>
                </div>

                <div className="mt-2.5">
                  {sens === "sorties" ? (
                    <Jauge budget={budget} depense={consomme} />
                  ) : (
                    <JaugeEntree attendu={budget} recu={consomme} />
                  )}
                </div>

                {/* Le détail sous la jauge : ce qui la compose, en petit. Il
                    n'ajoute rien au dessin, il le nomme — et c'est lui qui reste
                    si l'on retire le dessin. */}
                <p className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                  {l.montants.slice(0, -1).map((m, i) => (
                    <span key={i} className="whitespace-nowrap">
                      {/* Ces montants-là ne jugent pas : « dépensé » est négatif
                          par nature, sur chaque ligne, et le rouge y perdrait tout
                          sens à force d'être partout. C'est le reste, en haut à
                          droite, qui porte la couleur. */}
                      {colonnes[i]}{" "}
                      <span className="montant text-foreground">
                        <MontantAttrapable libelle={`${l.nom} · ${colonnes[i]}`} montant={m} />
                      </span>
                    </span>
                  ))}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
