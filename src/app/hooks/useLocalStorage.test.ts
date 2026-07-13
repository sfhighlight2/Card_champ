import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("seeds localStorage with the initial value on first read", () => {
    const { result } = renderHook(() => useLocalStorage("test:seed", { count: 1 }));
    expect(result.current[0]).toEqual({ count: 1 });
    expect(JSON.parse(window.localStorage.getItem("test:seed")!)).toEqual({ count: 1 });
  });

  it("reads an existing value instead of re-seeding", () => {
    window.localStorage.setItem("test:existing", JSON.stringify({ count: 5 }));
    const { result } = renderHook(() => useLocalStorage("test:existing", { count: 1 }));
    expect(result.current[0]).toEqual({ count: 5 });
  });

  it("persists updates made via the setter", () => {
    const { result } = renderHook(() => useLocalStorage("test:update", 0));
    act(() => result.current[1](7));
    expect(result.current[0]).toBe(7);
    expect(JSON.parse(window.localStorage.getItem("test:update")!)).toBe(7);
  });

  it("supports a functional updater", () => {
    const { result } = renderHook(() => useLocalStorage("test:fn", 1));
    act(() => result.current[1](prev => prev + 1));
    expect(result.current[0]).toBe(2);
  });

  it("supports a lazy initializer for the seed value", () => {
    const { result } = renderHook(() => useLocalStorage("test:lazy", () => ({ count: 9 })));
    expect(result.current[0]).toEqual({ count: 9 });
  });

  it("falls back to the seed value when stored JSON is corrupted", () => {
    window.localStorage.setItem("test:corrupt", "{not valid json");
    const { result } = renderHook(() => useLocalStorage("test:corrupt", { count: 1 }));
    expect(result.current[0]).toEqual({ count: 1 });
  });

  it("does not hold a live reference to the seed value passed in", () => {
    const seed = { count: 1 };
    const { result } = renderHook(() => useLocalStorage("test:isolation", seed));
    seed.count = 999;
    expect(result.current[0]).toEqual({ count: 1 });
  });
});
