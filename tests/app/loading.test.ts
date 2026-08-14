// Chaque écran de l'app doit avoir son squelette de chargement.
//
// Toutes les pages sous /app sont dynamiques : elles relisent la base à chaque
// visite. Sans fichier loading.tsx à côté d'une page, Next garde l'écran PRÉCÉDENT
// figé jusqu'à ce que le serveur réponde — une à deux secondes pendant lesquelles
// rien ne bouge, où l'on croit que le clic n'a pas pris et où l'on reclique.
//
// C'est un oubli invisible : la page marche, elle est seulement muette pendant son
// calcul. Ce test est là pour qu'une page ajoutée demain ne reparte pas sans voix.
import { describe, it, expect } from "vitest";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const RACINE = join(process.cwd(), "src/app/app");

// Tout dossier de /app qui contient une page.tsx.
function dossiersAvecPage(dir: string): string[] {
  const trouves: string[] = [];
  if (existsSync(join(dir, "page.tsx"))) trouves.push(dir);
  for (const entree of readdirSync(dir, { withFileTypes: true })) {
    // Les groupes de routes et les dossiers privés de Next ne sont pas des écrans.
    if (entree.isDirectory() && !entree.name.startsWith("_")) {
      trouves.push(...dossiersAvecPage(join(dir, entree.name)));
    }
  }
  return trouves;
}

describe("les squelettes de chargement", () => {
  it("couvrent tous les écrans de l'app", () => {
    const sansSquelette = dossiersAvecPage(RACINE)
      .filter((d) => !existsSync(join(d, "loading.tsx")))
      .map((d) => d.replace(process.cwd() + "/", ""));
    expect(sansSquelette).toEqual([]);
  });
});
