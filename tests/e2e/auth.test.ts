import { expect, test } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome to docs4llm" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Continue with Google/i })
    ).toBeVisible();
    await expect(
      page.getByText("Docs to MCP for every AI editor")
    ).toBeVisible();
  });

  test("register redirects to login", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL("/login");
    await expect(
      page.getByRole("button", { name: /Continue with Google/i })
    ).toBeVisible();
  });
});
