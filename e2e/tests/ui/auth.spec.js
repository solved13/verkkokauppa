import { test, expect } from "@playwright/test";
import { BACKEND_URL } from "../../env.js";

function uniqueEmail(tag) {
  return `${tag}.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`;
}

test.describe("Authentication (UI)", () => {
  // TEST 1 (Uusi käyttäjä rekisteröityy lomakkeen kautta ja siirtyy etusivulle)
  test("new user can register through the form and is redirected to the home page", async ({
    page,
  }) => {
    const email = uniqueEmail("ui-register");

    await page.goto("/");

    await page.getByRole("link", { name: "Rekisteröidy" }).click();

    await page.getByPlaceholder("Nimi").fill("Testi Käyttäjä");
    await page.getByPlaceholder("Sähköposti").fill(email);
    await page.getByPlaceholder("Salasana").fill("Salasana123");
    await page.getByRole("button", { name: "Rekisteröidy" }).click();

    await expect(page.getByText(/Hei, Testi Käyttäjä/)).toBeVisible();
  });
  // TEST 2 (Rekisteröitynyt käyttäjä kirjautuu sisään lomakkeen kautta)
  test("already registered user can log in through the login form", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("ui-login");
    const password = "PravidniyParol123";

    await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: "Login Test", email, password },
    });

    await page.goto("/");
    await page.getByPlaceholder("Sähköposti").fill(email);
    await page.getByPlaceholder("Salasana").fill(password);
    await page.getByRole("button", { name: "Kirjaudu" }).click();

    await expect(page.getByText(/Hei, Login Test/)).toBeVisible();
  });
  // TEST 3 (Väärä salasana näyttää virheen eikä salli pääsyä järjestelmään)
  test("incorrect password displays an error message and does not allow access", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("ui-wrong-pass");

    await request.post(`${BACKEND_URL}/api/auth/register`, {
      data: { name: "Error Test", email, password: "PravidniyParol123" },
    });

    await page.goto("/");
    await page.getByPlaceholder("Sähköposti").fill(email);
    await page.getByPlaceholder("Salasana").fill("NevirnyiParol");
    await page.getByRole("button", { name: "Kirjaudu" }).click();

    await expect(page.getByText("Väärä sähköposti tai salasana XXX")).toBeVisible();

    await expect(page.getByRole("button", { name: "Kirjaudu" })).toBeVisible();
  });
  // TEST 4 (Vaihtaminen kirjautumisen ja rekisteröitymisen välillä toimii molempiin suuntiin)
  test("switching between login and registration forms works both ways", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Kirjaudu sisään" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Rekisteröidy" }).click();
    await expect(
      page.getByRole("heading", { name: "Rekisteröidy" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Nimi")).toBeVisible();

    await page.getByRole("link", { name: "Kirjaudu sisään" }).click();
    await expect(
      page.getByRole("heading", { name: "Kirjaudu sisään" }),
    ).toBeVisible();
  });
  // TEST 5 (Kirjautumisnäytössä ei ole logoa eikä teeman vaihtajaa)
  test("the login screen has no logo or theme toggle", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator(".brand-mark")).toHaveCount(0);
    await expect(page.locator(".theme-toggle")).toHaveCount(0);
  });
});
