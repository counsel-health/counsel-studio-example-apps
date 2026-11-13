import { describe, expect, test } from "vitest";
import { getBarHeights, parseVelaTheme } from "../vela";

describe("parseVelaTheme", () => {
  test("accepts a known theme", () => {
    expect(parseVelaTheme("example")).toBe("example");
  });

  test("falls back to vela for missing or unknown values", () => {
    expect(parseVelaTheme(undefined)).toBe("vela");
    expect(parseVelaTheme("nope")).toBe("vela");
  });

  test("uses the first value when the param repeats", () => {
    expect(parseVelaTheme(["example", "vela"])).toBe("example");
  });
});

describe("getBarHeights", () => {
  test("maps the lowest value to min and the highest to max", () => {
    expect(getBarHeights([64, 67, 70], 70, 116)).toEqual([70, 93, 116]);
  });

  test("draws a flat series at full height instead of dividing by zero", () => {
    expect(getBarHeights([64, 64], 70, 116)).toEqual([116, 116]);
  });
});
