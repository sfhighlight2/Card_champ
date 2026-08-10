import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar, avatarInitials } from "./Avatar";

describe("avatarInitials", () => {
  it("takes first and last initials of a full name", () => {
    expect(avatarInitials("Andrew Cordle")).toBe("AC");
    expect(avatarInitials("Barbara Ann Corcoran")).toBe("BC");
  });

  it("takes two letters from a single word", () => {
    expect(avatarInitials("Madonna")).toBe("MA");
  });

  it("strips a leading @ so handles work too", () => {
    expect(avatarInitials("@garyvee")).toBe("GA");
  });

  it("splits on separators found in handles", () => {
    expect(avatarInitials("logan_paul")).toBe("LP");
    expect(avatarInitials("gary.vee")).toBe("GV");
    expect(avatarInitials("kevin-oleary")).toBe("KO");
  });

  it("degrades to ? rather than throwing on empty input", () => {
    expect(avatarInitials("")).toBe("?");
    expect(avatarInitials("   ")).toBe("?");
    expect(avatarInitials("@")).toBe("?");
  });
});

describe("Avatar", () => {
  it("renders the image when a src is present", () => {
    render(<Avatar src="http://img/a.png" name="Andrew Cordle" />);
    expect(screen.getByRole("img")).toHaveProperty("tagName", "IMG");
  });

  // A new account has no avatar_path, so resolveAvatar returns "" — the whole
  // reason this component exists, since <img src=""> shows a broken glyph.
  it("renders initials instead of a broken image when src is empty", () => {
    render(<Avatar src="" name="Andrew Cordle" />);
    expect(screen.getByLabelText("Andrew Cordle")).toHaveProperty("tagName", "DIV");
    expect(screen.getByText("AC")).toBeTruthy();
  });

  it("treats null and undefined the same as empty", () => {
    const { unmount } = render(<Avatar src={null} name="Gary Vee" />);
    expect(screen.getByText("GV")).toBeTruthy();
    unmount();
    render(<Avatar name="Gary Vee" />);
    expect(screen.getByText("GV")).toBeTruthy();
  });

  it("keeps the same placeholder colour for the same name", () => {
    const { unmount } = render(<Avatar name="Andrew Cordle" />);
    const first = screen.getByLabelText("Andrew Cordle").getAttribute("style");
    unmount();
    render(<Avatar name="Andrew Cordle" />);
    expect(screen.getByLabelText("Andrew Cordle").getAttribute("style")).toBe(first);
  });
});
