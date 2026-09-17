const { chromium } = await import(process.env.PLAYWRIGHT_PATH || "playwright");
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const output = new URL("../../public/videos/parcours/", import.meta.url)
  .pathname;
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const manifest = [];
for (const [device, width, height] of [
  ["desktop", 1280, 760],
  ["mobile", 390, 720],
]) {
  for (const scene of ["budgets", "depenses", "avenir"]) {
    if (
      existsSync(output + scene + "-" + device + ".mp4") &&
      !process.argv.includes("--refresh")
    ) {
      const duration = Number(
        execFileSync(
          "ffprobe",
          [
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            output + scene + "-" + device + ".mp4",
          ],
          { encoding: "utf8" },
        ),
      );
      manifest.push({
        scene,
        device,
        width,
        height,
        duration,
        source:
          "Actual Planora demo components; built-in fictitious fixtures only; no account, database writes or audio.",
        poster: scene + "-" + device + ".png",
        video: scene + "-" + device + ".mp4",
      });
      continue;
    }
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width, height },
      colorScheme: "light",
      recordVideo: {
        dir: "/tmp/planora-demo-recordings",
        size: { width, height },
      },
    });
    const page = await context.newPage();
    const started = Date.now();
    const errors = [],
      writes = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/*", async (route) => {
      if (!["GET", "HEAD"].includes(route.request().method())) {
        writes.push(route.request().method());
        await route.abort();
      } else await route.continue();
    });
    try {
      await page.goto("https://localhost:3000/apercu-capture", {
        waitUntil: "networkidle",
      });
      await page.addStyleTag({
        content:
          "nextjs-portal{display:none!important}*{cursor:none!important}",
      });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => {
        const cursor = document.createElement("div");
        cursor.id = "capture-pointer";
        cursor.style.cssText =
          "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);width:22px;height:28px;filter:drop-shadow(0 1px 2px #0005)";
        cursor.innerHTML =
          '<svg viewBox="0 0 24 30"><path d="M2 2V24L8 18L13 28L18 25L13 16H23Z" fill="#293331" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>';
        document.body.append(cursor);
        document.addEventListener("mousemove", (e) => {
          cursor.style.transform =
            "translate(" + e.clientX + "px," + e.clientY + "px)";
        });
      });
      const target =
        scene === "budgets"
          ? page
              .locator('[data-onboarding-target="adjust-transport"] button')
              .last()
          : scene === "depenses"
            ? page
                .locator('[data-onboarding-target="open-amount-detail"] button')
                .last()
            : page
                .locator('[data-cellkey="grand::soldePrevu::1"] button')
                .first();
      if (scene === "avenir" && device === "mobile") {
        await page
          .getByRole("button", { name: "Comparer", exact: true })
          .click();
        await page
          .locator('[data-onboarding-target="overview-ending-balance"]')
          .evaluate((e) => e.scrollIntoView({ block: "start" }));
      } else {
        await target.evaluate((e, mobile) => {
          const focus = mobile ? (e.closest("tr") ?? e) : e;
          focus.scrollIntoView({
            block: mobile ? "start" : "center",
            inline: "nearest",
          });
        }, device === "mobile");
        if (device === "desktop" && scene === "budgets")
          await page.locator("main").evaluate((e) => {
            e.scrollTop -= 96;
          });
      }
      await pause(700);
      const beginning = (Date.now() - started) / 1000;
      const poster = output + scene + "-" + device + ".png";
      await page.screenshot({ path: poster });
      await pause(1000);
      const click = async (locator) => {
        await locator.scrollIntoViewIfNeeded();
        const box = await locator.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
          steps: 24,
        });
        await pause(400);
        await locator.click();
        await pause(1000);
      };
      if (scene === "budgets") {
        await click(target);
        const amount = page.getByRole("spinbutton");
        await amount.waitFor();
        await amount.fill("160");
        await pause(1000);
        await click(
          page.getByRole("button", { name: "Appliquer", exact: true }),
        );
        await pause(900);
        await click(page.getByRole("button", { name: "Fermer", exact: true }));
        if (!/160,00/.test(await target.innerText()))
          throw Error("Budget edit missing");
      } else if (scene === "depenses") {
        await click(target);
        await pause(2000);
        await click(page.getByRole("button", { name: "Fermer", exact: true }));
      } else if (device === "mobile") {
        await click(
          page.getByRole("button", {
            name: "Comparer les soldes",
            exact: true,
          }),
        );
        await click(page.locator('button[value="soldePrevu"]'));
        await page
          .locator('[data-onboarding-target="overview-ending-balance"]')
          .scrollIntoViewIfNeeded();
      } else {
        await click(target);
        await pause(1200);
        await click(page.getByRole("button", { name: "Fermer", exact: true }));
        await page
          .locator('[data-cellkey="grand::soldePrevu::2"]')
          .first()
          .evaluate((e) =>
            e.scrollIntoView({
              block: "center",
              inline: "center",
              behavior: "smooth",
            }),
          );
      }
      await pause(1800);
      const duration = (Date.now() - started) / 1000 - beginning;
      await page.screenshot({
        path:
          "/tmp/planora-demo-recordings/" + scene + "-" + device + "-end.png",
      });
      if (errors.length || writes.length)
        throw Error(JSON.stringify({ errors, writes }));
      const recording = page.video();
      await context.close();
      const raw = await recording.path();
      execFileSync("ffmpeg", [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-ss",
        String(beginning),
        "-i",
        raw,
        "-t",
        String(duration),
        "-an",
        "-c:v",
        "libx264",
        "-crf",
        "18",
        "-preset",
        "fast",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        output + scene + "-" + device + ".mp4",
      ]);
      manifest.push({
        scene,
        device,
        width,
        height,
        duration,
        source:
          "Actual Planora demo components; built-in fictitious fixtures only; no account, database writes or audio.",
        poster: scene + "-" + device + ".png",
        video: scene + "-" + device + ".mp4",
      });
      await writeFile(
        poster + ".prompt.txt",
        "Origin: Playwright screenshot of the actual Planora demo components in a temporary development route, 2026-09-17. Built-in demonstration fixtures only; no customer data. Scene: " +
          scene +
          ". Format: " +
          device +
          ".",
      );
      console.log(JSON.stringify(manifest.at(-1)));
    } catch (error) {
      await page
        .screenshot({
          path:
            "/tmp/planora-demo-recordings/error-" +
            scene +
            "-" +
            device +
            ".png",
        })
        .catch(() => {});
      await context.close();
      throw error;
    }
  }
}
await writeFile(output + "manifest.json", JSON.stringify(manifest, null, 2));
await browser.close();
