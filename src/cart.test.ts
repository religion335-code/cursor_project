import { describe, expect, it } from "vitest";
import { addLine, cartCount, cartTotal, lineKey, setQty, setSauce } from "./cart";

describe("cart", () => {
  it("increments the same item and sauce", () => {
    const once = addLine([], "pork-loin");
    const twice = addLine(once, "pork-loin");
    expect(twice).toHaveLength(1);
    expect(twice[0]?.qty).toBe(2);
    expect(cartCount(twice)).toBe(2);
    expect(cartTotal(twice)).toBe(190);
  });

  it("keeps a separate line when the sauce changes", () => {
    const mixed = addLine(addLine([], "pork-loin", "normal"), "pork-loin", "less");
    expect(mixed).toHaveLength(2);
    expect(cartTotal(mixed)).toBe(190);
  });

  it("drops a line at quantity zero", () => {
    const lines = addLine([], "pork-rib");
    expect(setQty(lines, lineKey(lines[0]!), 0)).toEqual([]);
  });

  it("merges when a sauce change collides with an existing line", () => {
    const a = addLine([], "pork-loin", "normal");
    const b = addLine(a, "pork-loin", "less");
    const merged = setSauce(b, lineKey(b[1]!), "normal");
    expect(merged).toHaveLength(1);
    expect(merged[0]?.qty).toBe(2);
    expect(merged[0]?.sauce).toBe("normal");
  });
});
