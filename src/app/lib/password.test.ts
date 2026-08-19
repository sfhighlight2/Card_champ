import { describe, expect, it } from "vitest";
import { passwordPolicyError, PASSWORD_HINT } from "./password";

describe("passwordPolicyError", () => {
  it("accepts a password meeting the full policy", () => {
    expect(passwordPolicyError("Nabil!Flores1")).toBeNull();
    expect(passwordPolicyError("aB3!efgh")).toBeNull(); // exactly 8
  });

  it("rejects 7 characters even with every class present", () => {
    expect(passwordPolicyError("aB3!efg")).toBe("Passwords need at least 8 characters.");
  });

  it("names exactly the missing classes", () => {
    // The password Nabil-style signups actually try: long, lowercase + digit.
    expect(passwordPolicyError("nabilflores1")).toBe("Add an uppercase letter and a symbol.");
    expect(passwordPolicyError("NABILFLORES1")).toBe("Add a lowercase letter and a symbol.");
    expect(passwordPolicyError("nabilflores!")).toBe("Add an uppercase letter and a number.");
    expect(passwordPolicyError("Nabilflores1")).toBe("Add a symbol.");
  });

  it("lists three missing classes with commas", () => {
    expect(passwordPolicyError("nabilflores")).toBe(
      "Add an uppercase letter, a number, and a symbol."
    );
  });

  it("combines the length problem with missing classes", () => {
    expect(passwordPolicyError("nabil1")).toBe(
      "Passwords need at least 8 characters, plus an uppercase letter and a symbol."
    );
    expect(passwordPolicyError("")).toBe(
      "Passwords need at least 8 characters, plus a lowercase letter, an uppercase letter, a number, and a symbol."
    );
  });

  it("accepts every symbol in the server's set", () => {
    for (const sym of `!@#$%^&*()_+-=[]{};'\\:"|<>?,./\`~`) {
      expect(passwordPolicyError(`aBcdefg1${sym}`)).toBeNull();
    }
  });

  it("exports a hint consistent with the policy", () => {
    expect(PASSWORD_HINT).toMatch(/8\+/);
    expect(PASSWORD_HINT.toLowerCase()).toContain("uppercase");
  });
});
