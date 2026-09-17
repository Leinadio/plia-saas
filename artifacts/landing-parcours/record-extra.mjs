const { chromium } = await import(process.env.PLAYWRIGHT_PATH || "playwright");
import { writeFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const root = new URL("../../", import.meta.url).pathname;
const output = root + "public/videos/parcours/";
const browser = await chromium.launch();
const captures = [
  ["revenus", "group:-10001::recu::1"],
  ["charges", "group:-20004::budget::1"],
  ["reste", "group:-20002::reste::1"],
];
const manifest = JSON.parse(await readFile(output + "manifest.json", "utf8"));
try {
  for (const [scene, key] of captures) {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 760 },
      colorScheme: "light",
      recordVideo: {
        dir: "/tmp/planora-demo-recordings",
        size: { width: 1280, height: 760 },
      },
    });
    const page = await context.newPage();
    const started = Date.now();
    const errors = [];
    const writes = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/*", async (route) => {
      if (!["GET", "HEAD"].includes(route.request().method())) {
        writes.push(route.request().method());
        await route.abort();
      } else await route.continue();
    });
    await page.goto("https://localhost:3000/apercu-capture", {
      waitUntil: "networkidle",
    });
    await page.addStyleTag({
      content: "nextjs-portal{display:none!important}*{cursor:none!important}",
    });
    await page.evaluate(() => document.fonts.ready);
    const target = page.locator('[data-cellkey="' + key + '"] button').first();
    await target.evaluate((e) =>
      e.scrollIntoView({ block: "center", inline: "nearest" }),
    );
    await page.evaluate(() => {
      const p = document.createElement("div");
      p.style.cssText =
        "position:fixed;z-index:2147483647;pointer-events:none;left:-100px;top:-100px;width:22px;height:28px;filter:drop-shadow(0 1px 2px #0005)";
      p.innerHTML =
        '<svg viewBox="0 0 24 30"><path d="M2 2V24L8 18L13 28L18 25L13 16H23Z" fill="#293331" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>';
      document.body.append(p);
      document.addEventListener("mousemove", (e) => {
        p.style.left = e.clientX + "px";
        p.style.top = e.clientY + "px";
      });
    });
    await page.waitForTimeout(600);
    const start = (Date.now() - started) / 1000;
    await page.waitForTimeout(800);
    const box = await target.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
      steps: 24,
    });
    await page.waitForTimeout(350);
    await target.click();
    await page.getByRole("button", { name: "Fermer", exact: true }).waitFor();
    await page.waitForTimeout(2300);
    await page.screenshot({
      path: "/tmp/planora-demo-recordings/" + scene + "-detail.png",
    });
    await page.getByRole("button", { name: "Fermer", exact: true }).click();
    await page.waitForTimeout(1700);
    const duration = (Date.now() - started) / 1000 - start;
    if (errors.length || writes.length)
      throw Error(JSON.stringify({ errors, writes }));
    const recording = page.video();
    await context.close();
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-y",
      "-ss",
      String(start),
      "-i",
      await recording.path(),
      "-t",
      String(duration),
      "-an",
      "-c:v",
      "libx264",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      output + scene + "-desktop.mp4",
    ]);
    const entry = {
      scene,
      device: "desktop",
      width: 1280,
      height: 760,
      duration,
      source:
        "Actual Planora demo components; built-in fictional fixtures; network writes blocked.",
      video: scene + "-desktop.mp4",
    };
    const index = manifest.findIndex(
      (e) => e.scene === scene && e.device === "desktop",
    );
    if (index < 0) manifest.push(entry);
    else manifest[index] = entry;
    console.log(JSON.stringify(entry));
  }
  await writeFile(output + "manifest.json", JSON.stringify(manifest, null, 2));
} finally {
  await browser.close();
}
