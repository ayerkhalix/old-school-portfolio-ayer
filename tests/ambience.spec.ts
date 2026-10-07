import { test, expect } from "@playwright/test";

declare global {
  interface Window {
    audioProbe: { contexts: AudioContext[]; gains: GainNode[]; sources: AudioBufferSourceNode[] };
    ambientDraws: number;
  }
}

test("only brief sound effects play, with no looping ambient noise", async ({ page }) => {
  await page.addInitScript(() => {
    window.audioProbe = { contexts: [], gains: [], sources: [] };
    const Native = window.AudioContext;
    if (!Native) return;
    window.AudioContext = class extends Native {
      constructor(...args: ConstructorParameters<typeof AudioContext>) { super(...args); window.audioProbe.contexts.push(this); }
      createGain() { const node = super.createGain(); window.audioProbe.gains.push(node); return node; }
      createBufferSource() { const node = super.createBufferSource(); window.audioProbe.sources.push(node); return node; }
    };
  });
  await page.goto("/");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  expect(await page.evaluate(() => window.audioProbe.contexts.length)).toBe(0);
  await page.keyboard.press("a");
  await expect(page.locator(".screen-header")).toContainText("ABOUT");
  const touch = (page.viewportSize()?.width ?? 1440) <= 540;
  await expect(page.getByRole("button", { name: touch ? "Touch mute sound" : "Mute sound", exact: true })).toBeVisible();
  // The Windows WebKit test build has no Web Audio API. Verify its optional
  // audio fallback without pretending this emulation can exercise iOS sound.
  if (!await page.evaluate(() => typeof AudioContext !== "undefined")) {
    await expect(page.getByRole("button", { name: touch ? "Touch mute sound" : "Mute sound", exact: true })).toBeVisible();
    await page.keyboard.press("c");
    await expect(page.getByRole("heading", { name: "Have something in mind?", exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("portfolio.muted"))).toBe("false");
    return;
  }
  await expect.poll(() => page.evaluate(() => window.audioProbe.contexts[0]?.state)).toBe("running");
  await expect.poll(() => page.evaluate(() => window.audioProbe.gains[0].gain.value)).toBeCloseTo(.385, 3);
  expect(await page.evaluate(() => window.audioProbe.sources.filter(source => source.loop).length)).toBe(0);
  if (!touch) {
    await page.getByRole("button", { name: "Increase volume", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.audioProbe.gains[0].gain.value)).toBeCloseTo(.455, 3);
  }
  await page.getByRole("button", { name: touch ? "Power off" : "Turn television off", exact: true }).click();
  expect(await page.evaluate(() => window.audioProbe.sources.filter(source => source.loop).length)).toBe(0);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect.poll(() => page.evaluate(() => window.audioProbe.contexts[0].state)).toBe("suspended");
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect.poll(() => page.evaluate(() => window.audioProbe.contexts[0].state)).toBe("running");
  await page.getByRole("button", { name: touch ? "Touch mute sound" : "Mute sound", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.audioProbe.gains[0].gain.value)).toBeLessThan(.0001);
  await page.getByRole("button", { name: touch ? "Touch enable sound" : "Enable sound", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: touch ? "Touch mute sound" : "Mute sound", exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.audioProbe.contexts.length)).toBe(0);
});

test("ambient motion stops for reduced motion and hidden tabs, with a still-image fallback", async ({ page }) => {
  await page.addInitScript(() => {
    window.ambientDraws = 0;
    const draw = WebGLRenderingContext.prototype.drawArrays;
    WebGLRenderingContext.prototype.drawArrays = function (...args) {
      if (this.canvas instanceof HTMLCanvasElement && this.canvas.classList.contains("room-ambient")) window.ambientDraws++;
      draw.apply(this, args);
    };
  });
  await page.goto("/");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  const supported = await page.locator(".room-ambient").evaluate(e => !!(e as HTMLCanvasElement).getContext("webgl"));
  if (supported) {
    await expect(page.locator(".room-ambient")).toHaveClass(/ambient-ready/);
    const initial = await page.evaluate(() => window.ambientDraws);
    await page.waitForTimeout(300);
    // A randomized flicker can overlap this sample; four draws is its upper
    // bound, whereas the previous continuous shader drew many more frames.
    expect(await page.evaluate(() => window.ambientDraws)).toBeLessThanOrEqual(initial + 4);
    await expect.poll(() => page.evaluate(() => window.ambientDraws), { timeout: 10000 }).toBeGreaterThan(initial + 3);
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: true }); document.dispatchEvent(new Event("visibilitychange")); });
    const paused = await page.evaluate(() => window.ambientDraws);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.ambientDraws)).toBe(paused);
    await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
    await expect.poll(() => page.evaluate(() => window.ambientDraws), { timeout: 10000 }).toBeGreaterThan(paused + 3);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".room-ambient")).not.toHaveClass(/ambient-ready/);
    const reduced = await page.evaluate(() => window.ambientDraws);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.ambientDraws)).toBe(reduced);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(page.locator(".room-ambient")).toHaveClass(/ambient-ready/);
    await page.locator(".room-ambient").evaluate(e => (e as HTMLCanvasElement).getContext("webgl")?.getExtension("WEBGL_lose_context")?.loseContext());
    await expect(page.locator(".room-ambient")).not.toHaveClass(/ambient-ready/);
  }
  expect(await page.locator(".room-backdrop").evaluate(e => getComputedStyle(e).backgroundImage)).toContain("room.webp");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  await expect(page.locator(".room-ambient")).not.toHaveClass(/ambient-ready/);
  expect(await page.evaluate(() => window.ambientDraws)).toBe(0);
  if (supported) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(page.locator(".room-ambient")).toHaveClass(/ambient-ready/);
  }
  await page.keyboard.press("c");
  await expect(page.getByRole("heading", { name: "Have something in mind?", exact: true })).toBeVisible();
});
