import { describe, expect, test } from "vitest";
import { getBarHeights, getHomeSessionData, parseBrand } from "../brands";

describe("parseBrand", () => {
  test("accepts a known brand", () => {
    expect(parseBrand("vela")).toBe("vela");
  });

  test("falls back to studio for missing or unknown values", () => {
    expect(parseBrand(undefined)).toBe("studio");
    expect(parseBrand("nope")).toBe("studio");
  });

  test("uses the first value when the param repeats", () => {
    expect(parseBrand(["example", "vela"])).toBe("example");
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

describe("getHomeSessionData", () => {
  test("names the brand the session was launched from", () => {
    expect(getHomeSessionData("vela").metadata).toEqual({ app_name: "Vela" });
  });
});
