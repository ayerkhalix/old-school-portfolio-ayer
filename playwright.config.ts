import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", timeout: 30000, expect: { timeout: 7000 },
  fullyParallel: true, workers: 3, retries: 0,
  reporter: [["list"]], outputDir: ".sites-runtime/test-results",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [
    { name: "Desktop Chrome", use: { channel: "chrome", viewport: { width: 1440, height: 900 } } },
    { name: "Desktop Edge", use: { channel: "msedge", viewport: { width: 1366, height: 768 } } },
    { name: "Tablet Chrome", use: { channel: "chrome", viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 7"], channel: "chrome" } },
    { name: "Mobile WebKit", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
});
