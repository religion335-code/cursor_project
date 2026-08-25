import { itemById } from "./menu";
import type { CartLine, Sauce } from "./types";

export const sauceLabels: Record<Sauce, string> = {
  normal: "正常醬",
  less: "少醬",
  extra: "多醬",
};

export function lineKey(line: Pick<CartLine, "itemId" | "sauce">): string {
  return `${line.itemId}:${line.sauce}`;
}

export function addLine(
  lines: CartLine[],
  itemId: string,
  sauce: Sauce = "normal",
): CartLine[] {
  const key = lineKey({ itemId, sauce });
  const found = lines.find((line) => lineKey(line) === key);
  if (found) {
    return lines.map((line) =>
      lineKey(line) === key ? { ...line, qty: line.qty + 1 } : line,
    );
  }
  return [...lines, { itemId, sauce, qty: 1, note: "" }];
}

export function setQty(lines: CartLine[], key: string, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((line) => lineKey(line) !== key);
  return lines.map((line) => (lineKey(line) === key ? { ...line, qty } : line));
}

export function setSauce(lines: CartLine[], key: string, sauce: Sauce): CartLine[] {
  const current = lines.find((line) => lineKey(line) === key);
  if (!current || current.sauce === sauce) return lines;
  const others = lines.filter((line) => lineKey(line) !== key);
  const twin = others.find((line) => line.itemId === current.itemId && line.sauce === sauce);
  if (twin) {
    return others.map((line) =>
      line.itemId === current.itemId && line.sauce === sauce
        ? { ...line, qty: line.qty + current.qty }
        : line,
    );
  }
  return [...others, { ...current, sauce }];
}

export function setNote(lines: CartLine[], key: string, note: string): CartLine[] {
  return lines.map((line) => (lineKey(line) === key ? { ...line, note } : line));
}

export function lineTotal(line: CartLine): number {
  const item = itemById(line.itemId);
  if (!item) return 0;
  return item.price * line.qty;
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}
