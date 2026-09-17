const { chromium } = await import(process.env.PLAYWRIGHT_PATH || "playwright");
const browser = await chromium.launch();
try {
  for (const width of [1440, 390, 320, 820]) {
    const page = await browser.newPage({
      ignoreHTTPSErrors: true,
      viewport: { width, height: 1000 },
    });
    await page.goto(process.env.PLANORA_URL || "https://localhost:3000/", {
      waitUntil: "networkidle",
    });
    const section = page.locator("#demonstration");
    await section.scrollIntoViewIfNeeded();
    await page.setViewportSize({
      width,
      height: Math.ceil((await section.boundingBox()).height) + 80,
    });
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await section
      .getByRole("button", { name: "Mettre les animations en pause" })
      .click();
    const baseline = await page
      .locator("#budget-journey > div")
      .evaluateAll((nodes) =>
        nodes.map((n) => {
          const r = n.getBoundingClientRect();
          return {
            top: r.top + scrollY,
            left: r.left,
            height: r.height,
            width: r.width,
          };
        }),
      );
    await section.getByRole("button", { name: "Lire les animations" }).click();
    const samples = await page
      .locator("#budget-journey > div")
      .evaluateAll(async (nodes) => {
        const samples = [];
        for (let frame = 0; frame < 45; frame++) {
          samples.push(
            nodes.map((n) => {
              const r = n.getBoundingClientRect();
              return {
                top: r.top + scrollY,
                left: r.left,
                height: r.height,
                width: r.width,
              };
            }),
          );
          await new Promise(requestAnimationFrame);
        }
        return samples;
      });
    const shift = Math.max(
      ...samples.flatMap((sample) =>
        sample.flatMap((r, i) =>
          Object.keys(r).map((k) => Math.abs(r[k] - baseline[i][k])),
        ),
      ),
    );
    console.log(
      JSON.stringify({ width, cards: baseline.length, maximumShift: shift }),
    );
    if (shift > 0.5)
      throw Error(
        "Bento shifts " +
          shift.toFixed(2) +
          "px after resume at " +
          width +
          "px",
      );
    await page.close();
  }
} finally {
  await browser.close();
}
