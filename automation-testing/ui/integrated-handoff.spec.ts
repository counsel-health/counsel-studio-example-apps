import { expect, test, type Response } from "@playwright/test";

// Prefer a code with navMode: integrated; otherwise use the same JWT code as embedded-flow (CI sets E2E_ACCESS_CODE).
const accessCode =
  process.env["E2E_ACCESS_CODE_INTEGRATED"] ??
  process.env["E2E_ACCESS_CODE"] ??
  "AICHAT";

test.describe("integrated chat - connect to care handoff", () => {
  test("real Counsel API: signedAppUrl preloads on page load and Counsel iframe loads after handoff", async ({
    page,
  }) => {
    // signedAppUrl is now preloaded on page load rather than during the handoff.
    // Set up the listener before navigation so we don't miss it.
    const signedUrlResponsePromise = page.waitForResponse(
      (resp: Response) =>
        resp.url().includes("/signedAppUrl") &&
        resp.request().method() === "POST" &&
        resp.request().resourceType() === "fetch",
      { timeout: 30_000 }
    );

    await page.goto("/login");
    await page.getByLabel("Access Code").fill(accessCode!);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/(dashboard|integrated)/, {
      timeout: 15_000,
    });

    if (!page.url().includes("/integrated/chat")) {
      await page.goto("/integrated/chat");
    }
    await page.waitForLoadState("domcontentloaded");

    // Preload must succeed before the user interacts with the page.
    const preloadResponse = await signedUrlResponsePromise;
    expect(
      preloadResponse.ok(),
      `preload signedAppUrl failed: ${preloadResponse.status()}`
    ).toBe(true);

    const chatInput = page.getByPlaceholder("Type a message…");
    await expect(chatInput).toBeVisible({ timeout: 10_000 });

    const triggerText = "I need to see a doctor about my symptoms";
    await chatInput.click();
    await chatInput.pressSequentially(triggerText, { delay: 30 });
    await page.getByRole("button", { name: "Send" }).click();

    await expect(
      page.getByRole("button", { name: "Connect to Counsel" })
    ).toBeVisible();

    const createThreadResponsePromise = page.waitForResponse(
      (resp: Response) =>
        resp.url().includes("/threads") &&
        resp.request().method() === "POST" &&
        resp.request().resourceType() === "fetch"
    );

    await page.getByRole("button", { name: "Connect to Counsel" }).click();

    const threadResponse = await createThreadResponsePromise;
    expect(
      threadResponse.ok(),
      `POST /threads failed: ${threadResponse.status()}`
    ).toBe(true);

    await expect(
      page.getByRole("button", { name: /Counsel chat/ })
    ).toBeVisible({ timeout: 15_000 });

    const iframe = page.getByTitle("Counsel App");
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    const src = await iframe.getAttribute("src");
    expect(src).toBeTruthy();
    expect(src).toMatch(/^https?:\/\//);
    // The signed URL (preloaded or fresh) gets ?threadId= appended so the
    // Counsel app opens directly into the new thread.
    expect(src).toContain("threadId=");
  });
});
