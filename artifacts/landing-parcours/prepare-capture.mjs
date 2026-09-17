// Prepare a disposable app without credentials; never patch the real app for a recording.
import { cp, mkdir, readFile, writeFile, symlink } from "node:fs/promises";
const root = new URL("../../", import.meta.url).pathname;
const dest = process.env.CAPTURE_DIR || "/tmp/planora-feature-snapshot";
await mkdir(dest, { recursive: true });
for (const path of [
  "src",
  "artifacts/landing-parcours",
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "postcss.config.mjs",
])
  await cp(root + path, dest + "/" + path, { recursive: true });
for (const path of ["node_modules", "public"])
  await symlink(root + path, dest + "/" + path).catch((e) => {
    if (e.code !== "EEXIST") throw e;
  });
const component = dest + "/src/components/new-group-inline.tsx";
await writeFile(
  component,
  (await readFile(component, "utf8")).replace(
    'from "@/app/app/historique/actions"',
    'from "../../artifacts/landing-parcours/capture-budget-action"',
  ),
);
await mkdir(dest + "/src/app/apercu-capture", { recursive: true });
await writeFile(
  dest + "/src/app/apercu-capture/page.tsx",
  (
    await readFile(
      root + "artifacts/landing-parcours/feature-capture-page.tsx",
      "utf8",
    )
  ).replace(
    '"./feature-capture"',
    '"../../../artifacts/landing-parcours/feature-capture"',
  ),
);
console.log(dest);
