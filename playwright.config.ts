import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", timeout: 60000, expect: { timeout: 7000 },
  // Visibility-sensitive audio/lamp tests need a single foreground browser.
  fullyParallel: true, workers: 1, retries: 0,
  reporter: [["list"]], outputDir: ".sites-runtime/test-results",
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [
    { name: "Desktop Chrome", use: { channel: "chrome", viewport: { width: 1440, height: 900 } } },
    { name: "Desktop Edge", use: { channel: "msedge", viewport: { width: 1366, height: 768 } } },
    { name: "Tablet Chrome", use: { channel: "chrome", viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 7"], channel: "chrome" } },
    { name: "Mobile WebKit", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
});
