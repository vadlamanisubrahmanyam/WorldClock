import type { RatesCache } from "../types";

const BASE_URL = "https://api.frankfurter.dev/v1";

/**
 * Frankfurter mirrors European Central Bank reference rates: free, no API
 * key, no usage cap. Rates are published once per working day (~16:00 CET),
 * not a live trading feed — see the design doc (§7.1) for why that's the
 * right trade-off here. Always surface `fetchedAt`/`date` to the user rather
 * than presenting a bare number.
 */
export async function fetchLatestRates(base: string): Promise<RatesCache> {
  const res = await fetch(`${BASE_URL}/latest?base=${encodeURIComponent(base)}`);
  if (!res.ok) {
    throw new Error(`Frankfurter API error: ${res.status}`);
  }
  const json = await res.json();
  return {
    base: json.base,
    date: json.date,
    rates: json.rates,
    fetchedAt: Date.now(),
  };
}
