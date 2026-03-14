import { describe, expect, it } from "vitest";
import { isProtectedAppPath } from "@/lib/dashboard/navigation";

describe("isProtectedAppPath", () => {
  it("recognizes the protected shell routes", () => {
    expect(isProtectedAppPath("/dashboard")).toBe(true);
    expect(isProtectedAppPath("/patients")).toBe(true);
    expect(isProtectedAppPath("/appointments")).toBe(true);
    expect(isProtectedAppPath("/clinical-notes")).toBe(true);
    expect(isProtectedAppPath("/documents")).toBe(true);
    expect(isProtectedAppPath("/billing")).toBe(true);
    expect(isProtectedAppPath("/reports")).toBe(true);
    expect(isProtectedAppPath("/admin")).toBe(true);
    expect(isProtectedAppPath("/team")).toBe(true);
    expect(isProtectedAppPath("/onboarding")).toBe(true);
  });

  it("recognizes nested paths below protected routes", () => {
    expect(isProtectedAppPath("/patients/intake")).toBe(true);
    expect(isProtectedAppPath("/admin/settings")).toBe(true);
    expect(isProtectedAppPath("/reports/monthly")).toBe(true);
  });

  it("ignores public and auth routes", () => {
    expect(isProtectedAppPath("/")).toBe(false);
    expect(isProtectedAppPath("/login")).toBe(false);
    expect(isProtectedAppPath("/register")).toBe(false);
    expect(isProtectedAppPath("/auth/callback")).toBe(false);
  });
});
