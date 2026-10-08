/**
 * 東京証券取引所（JPX）公定制限値幅計算ユーティリティ
 * 基準価格（現在値・前日終値）から、ストップ高・ストップ安の制限値幅および上下限価格を算出します。
 */

export interface PriceLimit {
  basePrice: number;
  range: number;        // 値幅（±）
  low: number;          // 下限（ストップ安）
  high: number;         // 上限（ストップ高）
  displayText: string;  // 例: "1,340〜2,140"
  fullText: string;     // 例: "1,340〜2,140 (±400)"
}

export function getPriceLimit(priceStrOrNum?: string | number | null): PriceLimit | null {
  if (priceStrOrNum === undefined || priceStrOrNum === null || priceStrOrNum === '' || priceStrOrNum === '?') {
    return null;
  }

  // カンマや¥等を除去して数値化
  const cleaned = typeof priceStrOrNum === 'number' 
    ? priceStrOrNum 
    : parseFloat(String(priceStrOrNum).replace(/[^0-9.]/g, ''));

  if (isNaN(cleaned) || cleaned <= 0) {
    return null;
  }

  const p = Math.round(cleaned);
  let range = 0;

  // JPX 制限値幅テーブル
  if (p < 100) range = 30;
  else if (p < 200) range = 50;
  else if (p < 500) range = 80;
  else if (p < 700) range = 100;
  else if (p < 1000) range = 150;
  else if (p < 1500) range = 300;
  else if (p < 2000) range = 400;
  else if (p < 3000) range = 500;
  else if (p < 5000) range = 700;
  else if (p < 7000) range = 1000;
  else if (p < 10000) range = 1500;
  else if (p < 15000) range = 3000;
  else if (p < 20000) range = 4000;
  else if (p < 30000) range = 5000;
  else if (p < 50000) range = 7000;
  else if (p < 70000) range = 10000;
  else if (p < 100000) range = 15000;
  else if (p < 150000) range = 30000;
  else if (p < 200000) range = 40000;
  else if (p < 300000) range = 50000;
  else if (p < 500000) range = 70000;
  else if (p < 700000) range = 100000;
  else if (p < 1000000) range = 150000;
  else if (p < 1500000) range = 300000;
  else if (p < 2000000) range = 400000;
  else if (p < 3000000) range = 500000;
  else if (p < 5000000) range = 700000;
  else if (p < 7000000) range = 1000000;
  else if (p < 10000000) range = 1500000;
  else if (p < 15000000) range = 3000000;
  else if (p < 20000000) range = 4000000;
  else if (p < 30000000) range = 5000000;
  else if (p < 50000000) range = 7000000;
  else range = Math.round(p * 0.15);

  const low = Math.max(1, p - range);
  const high = p + range;

  return {
    basePrice: p,
    range,
    low,
    high,
    displayText: `${low.toLocaleString()}〜${high.toLocaleString()}`,
    fullText: `${low.toLocaleString()}〜${high.toLocaleString()} (±${range.toLocaleString()})`
  };
}
