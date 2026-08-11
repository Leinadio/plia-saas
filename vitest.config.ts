import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Même alias que tsconfig.json ("@/*" → "./src/*"). Sans lui, tout module de src qui
  // importe en « @/… » échoue au chargement dans les tests, ce qui rendait les actions
  // serveur de /transactions intestables alors que TypeScript, lui, les résolvait.
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Depuis que la base de test est un vrai Postgres, chaque fichier allume son propre
    // moteur. Seul, cela prend une demi-seconde ; à dix en même temps, la machine se
    // dispute ses cœurs et le même démarrage dépasse cinq secondes. Les deux réglages
    // vont ensemble : moins de fichiers à la fois, et un délai qui laisse la place à un
    // démarrage. Ce ne sont pas des pansements sur des tests lents — aucun ne met plus
    // de quelques millisecondes une fois sa base ouverte, et les moteurs sont ensuite
    // recyclés d'un test à l'autre (tests/helpers/pg.ts).
    maxWorkers: 4,
    testTimeout: 30_000,
  },
});
