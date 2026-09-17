// Record real production components as high-DPI PNG frames, then encode once.
// Run against the temporary development route described in README.md.
const { chromium } = await import(process.env.PLAYWRIGHT_PATH || "playwright");
import { mkdir, writeFile, readFile, rename } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { cursorCamera } from "./cursor-camera.mjs";
const output = new URL("../../public/videos/fonctionnalites/", import.meta.url)
  .pathname;
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const desktopScenes = [
  { name: "budgets", width: 1600, height: 900, zoom: 2.6 },
  { name: "transactions", width: 1000, height: 562, zoom: 1.8 },
  { name: "previsions", width: 1600, height: 900, zoom: 2.2 },
  { name: "depassements", width: 1600, height: 900, zoom: 2.6 },
  { name: "automatisation", width: 1000, height: 562, zoom: 1.8 },
];
const mobile = process.env.MOBILE === "1";
const scenes = desktopScenes.map((scene) => ({
  ...scene,
  width: mobile ? 360 : scene.width,
  height: mobile ? 660 : scene.height,
  dpr: mobile ? 3 : 2,
  zoom: mobile ? 1.08 : scene.zoom,
  clip: {
    x: 0,
    y: 0,
    width: mobile ? 360 : scene.width,
    height: mobile ? 660 : scene.height,
  },
  outputWidth: mobile ? 720 : 1280,
  outputHeight: mobile ? 1320 : 720,
}));
const manifest = [];
try {
  for (const scene of scenes) {
    const name = scene.name;
    const assetName = name + (mobile ? "-mobile" : "");
    if (process.env.SCENE && !process.env.SCENE.split(",").includes(name)) {
      try {
        manifest.push(
          JSON.parse(await readFile(output + assetName + ".mp4.json", "utf8")),
        );
      } catch {
        /* Not yet captured. */
      }
      continue;
    }
    const dir = "/tmp/planora-feature-frames/" + assetName;
    await mkdir(dir, { recursive: true });
    const page = await browser.newPage({
      ignoreHTTPSErrors: true,
      viewport: { width: scene.width, height: scene.height },
      deviceScaleFactor: scene.dpr,
      colorScheme: "light",
      locale: "fr-FR",
    });
    const errors = [],
      writes = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/*", (route) => {
      if (!["GET", "HEAD"].includes(route.request().method())) {
        writes.push({
          method: route.request().method(),
          url: route.request().url(),
          action: route.request().headers()["next-action"],
        });
        return route.abort();
      }
      return route.continue();
    });
    await page.goto(
      (process.env.PLANORA_URL || "https://localhost:3000") +
        "/apercu-capture?scene=" +
        name,
      { waitUntil: "networkidle" },
    );
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content: "nextjs-portal{display:none!important}*{cursor:none!important}",
    });
    const cell = (id, column) =>
      page.locator(`[data-cellkey="group:${id}::${column}::0"]`).first();
    const rowName = (name) => page.getByText(name, { exact: true }).first();
    const expenseHeading = page
      .locator('[data-history-section-heading="expense"]')
      .first();
    if (["budgets", "previsions", "depassements"].includes(name)) {
      if (mobile && name !== "budgets") {
        await page
          .getByRole("button", { name: "Comparer", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Comparer les dépenses", exact: true })
          .click();
        await page
          .locator(
            `button[value="${name === "depassements" ? "reste" : "budgetDep"}"]`,
          )
          .click();
        await page.waitForTimeout(400);
      }
      await expenseHeading.evaluate((e) =>
        e.scrollIntoView({ block: "start" }),
      );
    }
    let initialTarget;
    if (name === "budgets") initialTarget = rowName("Courses");
    else if (name === "transactions")
      initialTarget = page.getByLabel("Rechercher une opération");
    else if (name === "previsions") {
      if (mobile) {
        await page
          .getByRole("button", { name: "Comparer les soldes", exact: true })
          .click();
        await page.locator('button[value="soldeReel"]').click();
        await page.waitForTimeout(400);
        initialTarget = cell(-20003, "solde");
      } else
        initialTarget = expenseHeading.locator(
          '[data-history-column-zone="treasury"]',
        );
    } else if (name === "depassements") initialTarget = cell(-20003, "reste");
    else
      initialTarget = page.getByRole("button", {
        name: "Voir les correspondances",
      });
    await initialTarget.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const initialBox = await initialTarget.boundingBox();
    const initial = {
      zoom: scene.zoom,
      cx: (initialBox.x + initialBox.width / 2) / scene.width,
      cy: (initialBox.y + initialBox.height / 2) / scene.height,
      px: (initialBox.x + initialBox.width / 2) / scene.width,
      py: (initialBox.y + initialBox.height / 2) / scene.height,
    };
    let recording = true;
    const frames = [];
    const start = performance.now();
    const timeline = [];
    let camera = initial;
    const focus = async (locator, zoom = scene.zoom, duration = 0.85) => {
      await locator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(160);
      const box = await locator.boundingBox();
      const px = (box.x + box.width / 2) / scene.width;
      const py = (box.y + box.height / 2) / scene.height;
      camera = { zoom, cx: px, cy: py, px, py };
      timeline.push({
        time: (performance.now() - start) / 1000,
        duration,
        ...camera,
      });
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(duration * 1000);
    };
    const click = async (locator, zoom = scene.zoom) => {
      await focus(locator, zoom);
      await locator.click();
      await page.waitForTimeout(350);
    };
    const linger = async (locator, zoom = scene.zoom) => {
      await focus(locator, zoom);
      await page.waitForTimeout(1300);
    };
    let captureFailure;
    const recorder = (async () => {
      while (recording) {
        const index = frames.length;
        const file = dir + "/" + String(index).padStart(4, "0") + ".png";
        const time = (performance.now() - start) / 1000;
        await page.screenshot({
          path: file,
          clip: scene.clip,
          animations: "allow",
        });
        frames.push({ file, time });
        await page.waitForTimeout(65);
      }
    })().catch((error) => {
      captureFailure = error;
      recording = false;
    });
    await page.waitForTimeout(1300);
    if (name === "budgets") {
      await click(
        page.locator(
          '[data-history-section-heading="expense"] .history-section-add',
        ),
      );
      const nameInput = page.getByPlaceholder("Ex: Courses");
      await click(nameInput);
      await nameInput.pressSequentially("Vacances", { delay: 120 });
      const amount = page.locator('input[name="amount"]');
      await click(amount);
      await amount.pressSequentially("250", { delay: 180 });
      await linger(page.locator("form select"));
      await click(page.getByRole("button", { name: "Ajouter", exact: true }));
      await rowName("Vacances").waitFor();
      if (!(await cell(-90000, "budget").innerText()).includes("250"))
        throw Error(
          "The created budget must display its entered amount of 250 €",
        );
      await linger(rowName("Vacances"));
      await linger(cell(-90000, "budget"));
      await linger(rowName("Transport"));
      await linger(rowName("Courses"));
    } else if (name === "transactions") {
      const input = page.getByLabel("Rechercher une opération");
      await click(input);
      await input.pressSequentially("MONOPRIX", { delay: 150 });
      await linger(page.getByText("MONOPRIX", { exact: true }).first());
      await linger(page.getByText(/68,40/).last());
      await click(input);
      await input.fill("");
      await input.pressSequentially("LOYER", { delay: 150 });
      await linger(page.getByText("LOYER", { exact: true }).last());
      await click(input);
      await input.fill("");
    } else if (name === "previsions") {
      if (mobile) {
        // The mobile product switches the same treasury columns with its real filter.
        for (const column of ["soldeReel", "soldePrevu", "soldeDepass"]) {
          await click(
            page.getByRole("button", {
              name: "Comparer les soldes",
              exact: true,
            }),
          );
          await click(page.locator(`button[value="${column}"]`));
          await linger(cell(-20003, column === "soldeReel" ? "solde" : column));
        }
      } else {
        for (const column of ["solde", "soldePrevu", "soldeDepass"]) {
          await linger(cell(-20001, column));
          await linger(cell(-20003, column));
        }
      }
    } else if (name === "depassements") {
      await linger(rowName("Transport"));
      if (!mobile) {
        await linger(cell(-20003, "budget"));
        await linger(cell(-20003, "depense"));
      }
      await linger(cell(-20003, "reste"));
      await click(cell(-20003, "reste").getByRole("button").last());
      await linger(page.getByText(/Dépassé de/).last());
      await page.waitForTimeout(1400);
      await page
        .getByRole("button", {
          name: mobile ? "Retour au relevé" : "Fermer",
          exact: true,
        })
        .last()
        .click();
    } else {
      await linger(page.getByText(/Le libellé contient/).first());
      await click(
        page.getByRole("button", { name: "Voir les correspondances" }),
      );
      await linger(page.getByText("CARREFOUR CITY", { exact: true }));
      await linger(page.getByText("CARREFOUR MARKET", { exact: true }));
      await click(
        page.getByRole("button", { name: "Rattacher 2 transactions" }),
      );
      await linger(page.getByRole("status"));
    }
    // Stay close to the initial relevant information at the loop seam.
    await focus(initialTarget, scene.zoom, 1.1);
    await page.waitForTimeout(700);
    recording = false;
    await recorder;
    if (captureFailure) throw captureFailure;
    if (errors.length || writes.length)
      throw Error(JSON.stringify({ name, errors, writes }));
    const concat =
      frames
        .map(
          (frame, i) =>
            "file '" +
            frame.file +
            "'\nduration " +
            ((frames[i + 1]?.time ?? frame.time + 0.1) - frame.time).toFixed(5),
        )
        .join("\n") +
      "\nfile '" +
      frames.at(-1).file +
      "'\n";
    await writeFile(dir + "/frames.txt", concat);
    const cameraRender = await cursorCamera({
      timeline,
      initial,
      width: scene.outputWidth,
      height: scene.outputHeight,
      dir,
    });
    await writeFile(
      output + assetName + ".camera.json",
      JSON.stringify({ initial, timeline }, null, 2),
    );
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      dir + "/frames.txt",
      ...(cameraRender
        ? [
            "-loop",
            "1",
            "-i",
            cameraRender.pointer,
            "-filter_complex",
            cameraRender.filter,
            "-map",
            "[out]",
          ]
        : ["-vf", "fps=24"]),
      "-an",
      "-c:v",
      "libx264",
      "-crf",
      "17",
      "-preset",
      "medium",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      output + assetName + ".render.mp4",
    ]);
    await rename(
      output + assetName + ".render.mp4",
      output + assetName + ".mp4",
    );
    // The poster is a focused frame of the finished film, matching its crop and cursor.
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-ss",
      "0.1",
      "-i",
      output + assetName + ".mp4",
      "-frames:v",
      "1",
      output + assetName + ".png",
    ]);
    const provenance =
      "Origin: high-DPI lossless Playwright screenshots of real Planora production components, recorded 2026-09-17; synthetic demo data only, all network writes blocked. Scene " +
      name +
      ". A real UI action is recorded and encoded once to H.264, CRF 17. No generated interface." +
      (cameraRender
        ? " Smooth 60-fps camera and cursor follow the recorded control positions, always focused on the relevant information; no overview."
        : "");
    execFileSync("python3", [
      "-c",
      `import pathlib, struct, sys, zlib
p = pathlib.Path(sys.argv[1])
data = p.read_bytes()
payload = b"impeccable:prompt\\0" + sys.argv[2].encode()
chunk = b"tEXt" + payload
metadata = struct.pack(">I", len(payload)) + chunk + struct.pack(">I", zlib.crc32(chunk))
p.write_bytes(data[:-12] + metadata + data[-12:])`,
      output + assetName + ".png",
      provenance,
    ]);
    await writeFile(output + assetName + ".png.prompt.txt", provenance);
    await writeFile(output + assetName + ".mp4.prompt.txt", provenance);
    const entry = {
      scene: assetName,
      width: scene.outputWidth,
      height: scene.outputHeight,
      frames: frames.length,
      duration: frames.at(-1).time,
      ...(cameraRender
        ? { fps: 60, camera: "cursor-follow", maxZoom: scene.zoom }
        : {}),
      source: provenance,
    };
    manifest.push(entry);
    await writeFile(
      output + assetName + ".mp4.json",
      JSON.stringify(entry, null, 2),
    );
    console.log(JSON.stringify(entry));
    await page.close();
  }
  await writeFile(
    output + (mobile ? "manifest-mobile.json" : "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
} finally {
  await browser.close();
}
