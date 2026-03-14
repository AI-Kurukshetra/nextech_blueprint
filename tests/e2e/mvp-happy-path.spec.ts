import { expect, test, type Page } from "@playwright/test";

const staffEmail = process.env.E2E_STAFF_EMAIL;
const staffPassword = process.env.E2E_STAFF_PASSWORD;

async function selectFirstNonEmptyOption(page: Page, selector: string) {
  const option = page.locator(`${selector} option`).nth(1);
  await expect(option).toBeVisible();
  const value = await option.getAttribute("value");

  if (!value) {
    throw new Error(`No selectable option found for ${selector}.`);
  }

  await page.locator(selector).selectOption(value);
}

async function selectOptionContaining(page: Page, selector: string, contains: string) {
  const value = await page.locator(selector).evaluate((element, needle) => {
    if (!(element instanceof HTMLSelectElement)) {
      return "";
    }

    const option = Array.from(element.options).find((item) =>
      item.textContent?.toLowerCase().includes((needle as string).toLowerCase())
    );

    return option?.value ?? "";
  }, contains);

  if (!value) {
    throw new Error(`No option containing "${contains}" found for ${selector}.`);
  }

  await page.locator(selector).selectOption(value);
}

async function loginAsStaff(page: Page) {
  if (!staffEmail || !staffPassword) {
    test.skip(true, "Set E2E_STAFF_EMAIL and E2E_STAFF_PASSWORD to run happy-path E2E.");
  }

  await page.goto("/login");
  await page.getByPlaceholder("doctor@mahakurukshetra.com").fill(staffEmail as string);
  await page.getByPlaceholder("Enter your password").fill(staffPassword as string);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/dashboard|patients|onboarding/);
}

test("auth, intake, scheduling, charting, and billing happy path", async ({ page }) => {
  const suffix = Date.now().toString().slice(-6);
  const firstName = `E2E${suffix}`;
  const lastName = "Patient";

  await loginAsStaff(page);

  if (page.url().includes("/onboarding")) {
    test.skip(true, "E2E staff user must already belong to a practice.");
  }

  await page.goto("/patients");
  await page.getByPlaceholder("Ava").fill(firstName);
  await page.getByPlaceholder("Patel").fill(lastName);
  await page.locator("input[name='dateOfBirth']").fill("1993-05-14");
  await page.getByRole("button", { name: "Create patient" }).click();
  await expect(page.getByText("Patient created with chart number")).toBeVisible();

  await page.goto("/appointments");
  await selectOptionContaining(page, "select[name='patientId']", firstName);
  await selectFirstNonEmptyOption(page, "select[name='locationId']");
  await selectFirstNonEmptyOption(page, "select[name='providerUserId']");
  await page.locator("textarea[name='notes']").fill("E2E visit scheduling note.");
  await page.getByRole("button", { name: "Create appointment" }).click();
  await expect(page.getByText("Appointment scheduled for")).toBeVisible();

  await page.goto("/clinical-notes");
  await selectOptionContaining(page, "select[name='patientId']", firstName);
  await page.locator("textarea[name='subjective']").fill("E2E subjective note.");
  await page.getByRole("button", { name: "Save clinical note" }).click();
  await expect(page.getByText("Clinical note saved as draft.")).toBeVisible();

  await page.goto("/billing");
  await selectOptionContaining(page, "select[name='patientId']", firstName);
  await page.locator("input[name='cptCode']").fill("99213");
  await page.locator("input[name='chargeAmount']").fill("120");
  await page.locator("input[name='allowedAmount']").fill("95");
  await page.locator("input[name='balanceAmount']").fill("120");
  await page.getByRole("button", { name: "Save billing record" }).click();
  await expect(page.getByText("Billing record 99213 saved.")).toBeVisible();
});
