import { offerById, taxIncluded } from "./runway";
import type { OfferId, Quote } from "./types";

export function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export function buildQuote(input: {
  client: string;
  contact: string;
  offerId: OfferId;
  scope: string;
  taxIncludedFlag?: boolean;
}): Quote {
  const offer = offerById(input.offerId);
  return {
    id: makeId("q"),
    client: input.client.trim() || "未具名客戶",
    contact: input.contact.trim(),
    offerId: input.offerId,
    scope: input.scope.trim() || offer.summary,
    amount: offer.price,
    taxIncluded: input.taxIncludedFlag ?? true,
    createdAt: new Date().toISOString(),
    validDays: 14,
  };
}

export function quoteText(quote: Quote): string {
  const offer = offerById(quote.offerId);
  const money = quote.taxIncluded
    ? taxIncluded(quote.amount)
    : { pretax: quote.amount, tax: 0, total: quote.amount };
  const created = new Date(quote.createdAt).toLocaleDateString("zh-TW");
  const lines = [
    "蘭陽雲工 報價單",
    `日期：${created}`,
    `客戶：${quote.client}`,
    quote.contact ? `聯絡：${quote.contact}` : "",
    `方案：${offer.name}（${offer.tag}）`,
    `範圍：${quote.scope}`,
    `交付天數：${offer.deliveryDays} 日曆天（開工後）`,
    quote.taxIncluded
      ? `未稅 ${money.pretax.toLocaleString("zh-TW")}　稅額 ${money.tax.toLocaleString("zh-TW")}　含稅 ${money.total.toLocaleString("zh-TW")}`
      : `金額 NT$${money.total.toLocaleString("zh-TW")}（未含稅，開立發票時另計）`,
    "付款：簽約 50%，上線 50%。",
    `有效期限：${quote.validDays} 天。`,
    "說明：一人遠距工作室，以 Cloud 部署、Agent 交件。此報價為商業估列，非正式會計文件。",
  ];
  return lines.filter(Boolean).join("\n");
}
