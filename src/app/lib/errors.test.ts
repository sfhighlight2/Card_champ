import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { humanizeError } from "./errors";

// The real error is still logged; silence it so the suite output stays readable.
beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); });
afterAll(() => { vi.restoreAllMocks(); });

describe("humanizeError", () => {
  // This is the message the folder-colour bug actually produced in a toast.
  it("replaces raw constraint text with something actionable", () => {
    const msg = humanizeError({
      code: "23514",
      message: 'new row for relation "folders" violates check constraint "folders_color_check"',
    });
    expect(msg).toBe("That folder colour isn't valid.");
    expect(msg).not.toMatch(/constraint|relation/);
  });

  it("names the specific problem when the constraint is recognised", () => {
    expect(humanizeError({ code: "23505", message: 'duplicate key value violates unique constraint "profiles_handle_key"' }))
      .toBe("That handle is already taken.");
    expect(humanizeError({ code: "23514", message: 'violates check constraint "card_copies_grade_check"' }))
      .toBe("Grades run from 0 to 10.");
  });

  it("falls back to the SQLSTATE when the constraint is unfamiliar", () => {
    expect(humanizeError({ code: "42501", message: "permission denied for table card_copies" }))
      .toBe("You don't have permission to do that.");
    expect(humanizeError({ code: "23505", message: 'duplicate key value violates unique constraint "some_new_thing"' }))
      .toBe("That already exists.");
  });

  it("translates storage rejections", () => {
    expect(humanizeError({ message: "mime type text/plain;charset=UTF-8 is not supported" }))
      .toMatch(/JPEG, PNG, or WebP/);
    expect(humanizeError({ message: "The object exceeded the maximum allowed size" }))
      .toBe("That image is too large.");
  });

  // Our own RPCs raise messages written for people; those should survive.
  it("passes through deliberate, human RPC messages", () => {
    expect(humanizeError({ message: "Sign in to buy" })).toBe("Sign in to buy");
    expect(humanizeError({ message: "You cannot buy your own listing" })).toBe("You cannot buy your own listing");
    expect(humanizeError({ message: "Pick someone else to message" })).toBe("Pick someone else to message");
  });

  it("hides anything that looks like internals, even without a code", () => {
    expect(humanizeError({ message: 'null value in column "owner_id" violates not-null constraint' }))
      .toBe("Something went wrong. Please try again.");
    expect(humanizeError({ message: "JWT expired" })).toBe("Something went wrong. Please try again.");
  });

  it("uses the caller's fallback for empty or unknown input", () => {
    expect(humanizeError(null, "Could not sign in.")).toBe("Could not sign in.");
    expect(humanizeError(undefined, "Could not sign in.")).toBe("Could not sign in.");
  });

  it("does not dump an essay into a toast", () => {
    const long = "x".repeat(400);
    expect(humanizeError({ message: long })).toBe("Something went wrong. Please try again.");
  });
});
