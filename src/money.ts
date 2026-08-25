export function ntd(amount: number): string {
  return `NT$${amount.toLocaleString("zh-TW")}`;
}

export function minutesFromHhmm(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function hhmmFromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
