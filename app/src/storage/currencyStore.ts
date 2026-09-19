import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CurrencyPrefs, RatesCache } from "../types";

const PREFS_KEY = "worldclock:currencyPrefs";
const CACHE_KEY = "worldclock:ratesCache";

export const DEFAULT_CURRENCY_PREFS: CurrencyPrefs = { from: "USD", to: "INR" };

export async function getCurrencyPrefs(): Promise<CurrencyPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_CURRENCY_PREFS, ...JSON.parse(raw) } : DEFAULT_CURRENCY_PREFS;
  } catch {
    return DEFAULT_CURRENCY_PREFS;
  }
}

export async function saveCurrencyPrefs(prefs: CurrencyPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function getRatesCache(): Promise<RatesCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveRatesCache(cache: RatesCache): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}
