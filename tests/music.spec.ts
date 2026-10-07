import { test, expect, type Page } from "@playwright/test";
declare global { interface Window { musicProbe: HTMLAudioElement[]; musicPlayAttempts: number } }
const mobile = (page: Page) => (page.viewportSize()?.width ?? 1440) <= 540;
async function ensurePlaying(page: Page) {
  const play = page.getByRole("button", { name: "Play music", exact: true });
  if (await play.isVisible()) await play.click();
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(false);
}
async function tune(page: Page, channel: string) {
  if (mobile(page)) await page.getByLabel("Choose channel").selectOption(channel.toLowerCase());
  else await page.getByRole("button", { name: `Tune to ${channel}`, exact: true }).click();
  await expect(page.locator(".screen-header")).toContainText(channel.toUpperCase());
  await expect(page.locator(".tv-screen")).not.toHaveClass(/changing-channel/);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.musicProbe = [];
    window.musicPlayAttempts = 0;
    let interacted = false;
    document.addEventListener("pointerdown", () => { interacted = true; });
    document.addEventListener("keydown", () => { interacted = true; });
    const nativePlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      window.musicPlayAttempts++;
      if (!interacted && sessionStorage.getItem("test.allow-autoplay") !== "true") return Promise.reject(new DOMException("Gesture required", "NotAllowedError"));
      return nativePlay.call(this);
    };
    const Native = window.Audio;
    window.Audio = function (src?: string) { const el = new Native(src); window.musicProbe.push(el); return el; } as unknown as typeof Audio;
  });
  await page.goto("/"); await expect(page.locator(".boot-screen")).toHaveCount(0);
});
test("real music, volume, mute, seeking, looping and fullscreen continuity", async ({ page }) => {
  // This exercises playback plus three reloads and native browser transitions.
  test.setTimeout(120000);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(true);
  await tune(page, "Music");
  await expect(page.locator(".screen-scroll")).toHaveJSProperty("scrollTop", 0);
  await expect(page.locator(".radio-track-list li")).toHaveCount(4);
  await ensurePlaying(page);
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(false);
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.duration)).toBeGreaterThan(30);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.volume)).toBeCloseTo(.55);
  await page.getByRole("button", { name: "Music increase volume", exact: true }).click();
  await expect(page.locator(".volume-osd")).toContainText("VOLUME 60");
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.volume)).toBeCloseTo(.6);
  await expect(page.locator(".volume-osd")).toHaveCount(0);
  await page.keyboard.press("m"); expect(await page.evaluate(() => window.musicProbe.at(-1)!.muted)).toBe(true);
  await page.keyboard.press("m"); expect(await page.evaluate(() => window.musicProbe.at(-1)!.muted)).toBe(false);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.volume)).toBeCloseTo(.6);
  await page.locator(".screen-scroll").focus(); await page.keyboard.press("ArrowRight");
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.currentTime)).toBeGreaterThan(9);
  await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter");
  await expect(page.locator(".radio-track-list button.current")).toContainText("02");
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(false);
  await page.evaluate(() => window.musicProbe.at(-1)!.dispatchEvent(new Event("ended")));
  await expect(page.locator(".radio-track-list button.current")).toContainText("03");
  await page.getByRole("button", { name: /^Play track 4:/ }).click();
  await page.evaluate(() => window.musicProbe.at(-1)!.dispatchEvent(new Event("ended")));
  await expect(page.locator(".radio-track-list button.current")).toContainText("01");
  await page.getByRole("button", { name: /^Play track 3:/ }).click();
  expect(await page.evaluate(() => localStorage.getItem("portfolio.selectedTrack"))).not.toContain("Illusion");
  await tune(page, "Projects");
  const source = await page.evaluate(() => window.musicProbe.at(-1)!.src);
  await page.evaluate(() => { HTMLElement.prototype.requestFullscreen = () => Promise.reject(new Error("Denied")); });
  await page.getByRole("button", { name: mobile(page) ? "Touch fullscreen" : "Enter fullscreen", exact: true }).click();
  await expect(page.locator(".portfolio-room")).toHaveClass(/immersive/);
  expect(await page.evaluate(() => window.musicProbe.filter(el => el.getAttribute("src")).length)).toBe(1);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.src)).toBe(source);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(false);
  await page.getByRole("button", { name: mobile(page) ? "Touch exit fullscreen" : "Exit fullscreen", exact: true }).click();
  await page.getByRole("button", { name: mobile(page) ? "Power off" : "Turn television off", exact: true }).click();
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(false);
  await page.reload();
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(true);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.volume)).toBeCloseTo(.6);
  await tune(page, "Music");
  await expect(page.locator(".radio-track-list button.current")).toContainText("01Illusion");
  await expect(page.locator(".screen-scroll")).toHaveJSProperty("scrollTop", 0);
  expect(await page.evaluate(() => localStorage.getItem("portfolio.selectedTrack"))).toContain("Illusion");
  await ensurePlaying(page);
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(false);
  await page.getByRole("button", { name: "Stop music", exact: true }).click();
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(true);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.currentTime)).toBe(0);
  // A direct Music reload with a saved later track still opens at the deck.
  await page.reload();
  await expect(page.locator(".boot-screen")).toHaveCount(0);
  await expect(page.locator(".screen-header")).toContainText("MUSIC");
  await expect(page.locator(".screen-scroll")).toHaveJSProperty("scrollTop", 0);
  await ensurePlaying(page);
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(false);
});
test("an unavailable playlist stops safely", async ({ page }) => {
  // Real 404 responses also reach WebKit's native media loader, whose requests
  // on Windows can bypass Playwright's network routing interception.
  await page.evaluate(() => {
    const el = window.musicProbe.at(-1)!;
    const source = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "src")!;
    Object.defineProperty(el, "src", { get() { return source.get!.call(this); }, set(value: string) { source.set!.call(this, `/__missing_audio__/${encodeURIComponent(value)}`); } });
    el.src = el.src;
  });
  await tune(page, "Music");
  const play = page.getByRole("button", { name: "Play music", exact: true });
  if (await play.isVisible()) await play.click();
  await expect(page.locator(".radio-error")).toContainText("NO AUDIO SIGNAL");
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(true);
  await tune(page, "Projects"); await expect(page.locator(".project-browser")).toBeVisible();
});
test("a failed track is skipped while the next real track plays", async ({ page }) => {
  await page.evaluate(() => {
    const el = window.musicProbe.at(-1)!, broken = el.src;
    const source = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "src")!;
    Object.defineProperty(el, "src", { get() { return source.get!.call(this); }, set(value: string) { source.set!.call(this, new URL(value, location.href).href === broken ? "/__missing_audio__/first.mp3" : value); } });
    el.src = broken;
  });
  await tune(page, "Music");
  await ensurePlaying(page);
  await expect(page.locator(".radio-track-list button.current")).toContainText("02");
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(false);
});
test("HTML music works without Web Audio and remote controls are contextual", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, "AudioContext", { value: undefined, configurable: true }); });
  await page.reload(); await tune(page, "Music");
  await ensurePlaying(page);
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(false);
  if (!mobile(page)) {
    await page.getByRole("button", { name: "Remote next track", exact: true }).click();
    await expect(page.locator(".screen-header")).toContainText("CH 08");
    await expect(page.locator(".radio-track-list button.current")).toContainText("02");
    await page.getByRole("button", { name: "Next track selection", exact: true }).click();
    await page.getByRole("button", { name: "Play selected track", exact: true }).click();
    await expect(page.locator(".radio-track-list button.current")).toContainText("03");
    await page.getByRole("button", { name: "Increase volume", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.volume)).toBeCloseTo(.65);
  }
});
test("a browser autoplay denial leaves a usable play prompt", async ({ page }) => {
  await page.evaluate(() => { HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("User gesture required", "NotAllowedError")); });
  await tune(page, "Music");
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(page.locator(".radio-error")).toContainText("PRESS PLAY");
  await expect(page.getByRole("button", { name: "Play music", exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(true);
});

test("startup attempts Illusion unmuted and first interaction starts playback", async ({ page }) => {
  expect(await page.evaluate(() => window.musicPlayAttempts)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.src)).toContain("Illusion");
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.muted)).toBe(false);
  await page.locator("body").click({ position: { x: 2, y: 2 } });
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(false);
  await page.keyboard.press("m");
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.muted)).toBe(true);
  await page.reload(); await expect(page.locator(".boot-screen")).toHaveCount(0);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.muted)).toBe(false);
});
test("Illusion actually autoplays when the browser permits it", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Native WebKit may require a gesture even when the test gate allows autoplay.");
  await page.evaluate(() => {
    sessionStorage.setItem("test.allow-autoplay", "true");
    localStorage.setItem("portfolio.muted", "true");
    localStorage.setItem("portfolio.selectedTrack", "obsolete previous track");
  });
  await page.reload(); await expect(page.locator(".boot-screen")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(false);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.src)).toContain("Illusion");
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.muted)).toBe(false);
});
test("explicit stop prevents later gestures from restarting the radio", async ({ page }) => {
  await tune(page, "Music"); await ensurePlaying(page);
  await page.getByRole("button", { name: "Stop music", exact: true }).click();
  await page.locator("body").click({ position: { x: 2, y: 2 } });
  await page.keyboard.press("h");
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(true);
});

test("a saved zero volume cannot silently disable startup or the Play button", async ({ page }) => {
  await page.evaluate(() => { localStorage.setItem("portfolio.volume", "0"); });
  await page.reload(); await expect(page.locator(".boot-screen")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start radio", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start radio", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.currentTime)).toBeGreaterThan(.2);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.volume)).toBeCloseTo(.55);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.muted)).toBe(false);
  await tune(page, "Music");
  await page.getByRole("button", { name: "Stop music", exact: true }).click();
  for (let i = 0; i < 11; i++) await page.keyboard.press("-");
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.volume)).toBe(0);
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.volume)).toBeCloseTo(.55);
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.currentTime)).toBeGreaterThan(.2);
});

test("a touch release starts the radio when the press is not an allowed gesture", async ({ page }) => {
  await page.evaluate(() => {
    const play = HTMLMediaElement.prototype.play;
    let released = false;
    document.addEventListener("pointerup", () => { released = true; }, true);
    HTMLMediaElement.prototype.play = function () {
      return released ? play.call(this) : Promise.reject(new DOMException("Touch release required", "NotAllowedError"));
    };
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
  });
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.paused)).toBe(true);
  await page.locator("body").click({ position: { x: 2, y: 2 } });
  await expect.poll(() => page.evaluate(() => window.musicProbe.at(-1)!.currentTime)).toBeGreaterThan(.2);
  await expect(page.getByRole("button", { name: "Start radio", exact: true })).toHaveCount(0);
});

test("Illusion produces a real nonzero audio signal", async ({ page }) => {
  test.skip(await page.evaluate(() => typeof AudioContext === "undefined"), "Web Audio is unavailable in this browser build.");
  await page.evaluate(() => {
    const context = new AudioContext();
    const source = context.createMediaElementSource(window.musicProbe.at(-1)!);
    const analyser = context.createAnalyser();
    source.connect(analyser); analyser.connect(context.destination);
    Object.assign(window, { signalProbe: { context, analyser } });
    document.addEventListener("click", () => { void context.resume(); }, { once: true });
  });
  await page.getByRole("button", { name: "Start radio", exact: true }).click();
  await expect.poll(() => page.evaluate(() => {
    const probe = (window as unknown as { signalProbe: { analyser: AnalyserNode } }).signalProbe;
    const samples = new Float32Array(probe.analyser.fftSize);
    probe.analyser.getFloatTimeDomainData(samples);
    return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
  }), { timeout: 15000 }).toBeGreaterThan(.01);
  expect(await page.evaluate(() => window.musicProbe.at(-1)!.muted)).toBe(false);
});
