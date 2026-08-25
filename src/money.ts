const formatter = new Intl.NumberFormat("zh-TW");

export function ntd(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}NT$${formatter.format(Math.abs(rounded))}`;
}

export function monthsLabel(months: number): string {
  if (!Number.isFinite(months)) return "∞";
  if (months <= 0) return "0 個月";
  if (months > 36) return "超過 3 年";
  const whole = Math.floor(months);
  const days = Math.round((months - whole) * 30);
  if (days === 0) return `${whole} 個月`;
  return `${whole} 個月又約 ${days} 天`;
}

/** Parse 10萬 / 10,000 / 10000 / NT$100000 */
export function parseTaiwanMoney(input: string): number | null {
  const trimmed = input.replace(/,/g, "").replace(/NT\$/gi, "").trim();
  const wan = trimmed.match(/(\d+(?:\.\d+)?)\s*萬/);
  if (wan) return Math.round(Number(wan[1]) * 10_000);
  const plain = trimmed.match(/(\d+(?:\.\d+)?)/);
  if (!plain) return null;
  const value = Number(plain[1]);
  if (!Number.isFinite(value)) return null;
  return Math.round(value);
}
