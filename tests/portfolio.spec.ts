import { test, expect, type Page } from "@playwright/test";
const sections = ["Home", "About", "Projects", "Experience", "Skills", "Awards", "Contact", "Music"];
const headings = ["Ayer Khali Abrio.", "Hi, I'm Yeng.", "Things I've built.", "Learning by building.", "Tools of the trade.", "Good work, recognized.", "Have something in mind?", "Night Radio."];
const mobile = (page: Page) => (page.viewportSize()?.width ?? 1440) <= 540;
async function tune(page: Page, section: string) {
  if (mobile(page)) await page.getByLabel("Choose channel").selectOption(section.toLowerCase());
  else await page.getByRole("button", { name: `Tune to ${section}`, exact: true }).click();
  await expect(page.locator(".screen-header")).toContainText(section.toUpperCase());
  await expect(page.locator(".tv-screen")).not.toHaveClass(/changing-channel/);
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".boot-screen")).toHaveCount(0);
});
test("all eight channels, verified links, and no page errors", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  for (let i = 0; i < sections.length; i++) {
    await tune(page, sections[i]);
    await expect(page.getByRole("heading", { name: headings[i], exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`#${sections[i].toLowerCase()}$`));
  }
  await tune(page, "Contact");
  await expect(page.getByRole("link", { name: /ayerkhalidesu@gmail.com/ })).toHaveAttribute("href", "mailto:ayerkhalidesu@gmail.com");
  await expect(page.getByRole("link", { name: "GitHub", exact: true })).toHaveAttribute("href", "https://github.com/ayerkhalix");
  await expect(page.getByRole("link", { name: "LinkedIn", exact: true })).toHaveAttribute("href", /linkedin.com\/in\/ayer-khali/);
  expect(errors).toEqual([]);
});
test("remote browses projects, opens details, scrolls and returns", async ({ page }) => {
  await tune(page, "Projects");
  await page.getByRole("button", { name: mobile(page) ? "Touch next project or channel" : "Next project or channel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "CaulerID", exact: true })).toBeVisible();
  await page.getByRole("button", { name: mobile(page) ? "Touch select project" : "Select project", exact: true }).click();
  await expect(page.locator(".project-highlights")).toContainText("Trained MobileNetV3Small");
  await page.locator(".screen-scroll").evaluate(e => e.scrollTop = e.scrollHeight);
  await expect(page.getByRole("link", { name: "Source code", exact: true })).toHaveAttribute("href", "https://github.com/ayerkhalix/cauler-id");
  await page.getByRole("button", { name: mobile(page) ? "Touch back" : "Go back", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Things I've built.", exact: true })).toBeVisible();
  await expect(page.locator(".screen-scroll")).toHaveJSProperty("scrollTop", 0);
});
test("power recovers through navigation and sound defaults on after reload", async ({ page }) => {
  await page.getByRole("button", { name: mobile(page) ? "Power off" : "Turn television off", exact: true }).click();
  await expect(page.locator(".tv-screen")).toHaveClass(/screen-off/);
  await expect(page.locator(".power-off-message")).toBeVisible();
  await tune(page, "About"); await expect(page.locator(".tv-screen")).toHaveClass(/screen-on/);
  await page.getByRole("button", { name: mobile(page) ? "Touch mute sound" : "Mute sound", exact: true }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("portfolio.muted"))).toBe("true");
  await page.reload(); await expect(page.locator(".boot-screen")).toHaveCount(0);
  await expect(page.getByRole("button", { name: mobile(page) ? "Touch mute sound" : "Mute sound", exact: true })).toBeVisible();
  await expect(page.locator(".screen-header")).toContainText("ABOUT");
});
test("deep links, browser history, and keyboard shortcuts", async ({ page }) => {
  await page.goto("/#awards"); await expect(page.getByRole("heading", { name: "Good work, recognized.", exact: true })).toBeVisible();
  await tune(page, "Contact"); await page.goBack();
  await expect(page.locator(".screen-header")).toContainText("AWARDS");
  await page.locator("body").click({ position: { x: 3, y: 3 } });
  await page.keyboard.press("p"); await expect(page.locator(".screen-header")).toContainText("PROJECTS");
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("Enter");
  await expect(page.locator(".project-highlights")).toBeVisible();
  await page.keyboard.press("Escape"); await expect(page.locator(".project-browser")).toBeVisible();
  await page.keyboard.press("?"); await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("fullscreen fallback retains channel and exits without a reload", async ({ page }) => {
  await page.evaluate(() => { HTMLElement.prototype.requestFullscreen = () => Promise.reject(new Error("Unavailable in this browser")); });
  await tune(page, "Skills");
  const before = await page.locator(".tv-screen").boundingBox();
  await page.getByRole("button", { name: mobile(page) ? "Touch fullscreen" : "Enter fullscreen", exact: true }).click();
  await expect(page.locator(".portfolio-room")).toHaveClass(/immersive/);
  await tune(page, "Projects"); await expect(page.locator(".portfolio-room")).toHaveClass(/immersive/);
  if (!mobile(page)) { const after = await page.locator(".tv-screen").boundingBox(); expect(after!.width).toBeGreaterThan(before!.width); }
  await page.getByRole("button", { name: mobile(page) ? "Touch exit fullscreen" : "Exit fullscreen", exact: true }).click();
  await expect(page.locator(".portfolio-room")).not.toHaveClass(/immersive/);
  await expect(page.locator(".screen-header")).toContainText("PROJECTS");
});
test("reduced motion, visible keyboard focus, and no horizontal overflow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveCount(1);
  expect(await page.locator(":focus").evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe("none");
  for (const section of ["Home", "Projects", "About", "Contact"]) {
    await tune(page, section);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator(".screen-interface").evaluate(e => getComputedStyle(e).animationName)).toBe("none");
  }
  if (mobile(page)) {
    const buttons = await page.locator(".mobile-controller button").evaluateAll(elements => elements.map(e => ({ w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height })));
    for (const b of buttons) { expect(b.w).toBeGreaterThanOrEqual(44); expect(b.h).toBeGreaterThanOrEqual(44); }
  }
});
test("WebGL failure and slow imagery still leave a working portfolio", async ({ page }) => {
  await page.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) { if (type.startsWith("webgl")) return null; return original.call(this, type as "2d", ...args); } as typeof original; });
  await page.route("**/images/coast.webp", route => route.abort());
  await page.reload(); await expect(page.locator(".boot-screen")).toHaveCount(0);
  await tune(page, "Projects"); await expect(page.locator(".project-browser")).toBeVisible();
  await tune(page, "Contact"); await expect(page.getByRole("link", { name: /ayerkhalidesu@gmail.com/ })).toBeVisible();
});
test("rapid channel input settles on the last selection", async ({ page }) => {
  if (mobile(page)) { await page.getByLabel("Choose channel").selectOption("projects"); await page.getByLabel("Choose channel").selectOption("skills"); await page.getByLabel("Choose channel").selectOption("contact"); }
  else { await page.getByRole("button", { name: "Tune to Projects", exact: true }).click(); await page.getByRole("button", { name: "Tune to Skills", exact: true }).click(); await page.getByRole("button", { name: "Tune to Contact", exact: true }).click(); }
  await expect(page.locator(".screen-header")).toContainText("CONTACT"); await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator(".tv-screen")).not.toHaveClass(/changing-channel/);
});
