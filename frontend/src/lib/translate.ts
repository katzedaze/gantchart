const CACHE_KEY = "translate-cache-v1";
const MAX_CACHE_ENTRIES = 500;

interface CacheEntry {
  text: string;
  timestamp: number;
}

type TranslateCache = Record<string, CacheEntry>;

function loadCache(): TranslateCache {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as TranslateCache) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: TranslateCache) {
  try {
    // Evict oldest entries if over limit
    const entries = Object.entries(cache);
    if (entries.length > MAX_CACHE_ENTRIES) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toKeep = entries.slice(entries.length - MAX_CACHE_ENTRIES);
      cache = Object.fromEntries(toKeep);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full - clear old cache
    localStorage.removeItem(CACHE_KEY);
  }
}

function cacheKey(text: string, from: string, to: string): string {
  // Use first 100 chars + length as key to avoid huge keys
  const shortText = text.slice(0, 100);
  return `${from}:${to}:${shortText}:${text.length}`;
}

/**
 * Translate text via the Next.js API route with localStorage caching.
 */
export async function translateText(
  text: string,
  to: string = "ja",
  from: string = "en"
): Promise<string> {
  if (!text.trim()) return "";

  // Check cache
  const key = cacheKey(text, from, to);
  const cache = loadCache();
  if (cache[key]) {
    return cache[key].text;
  }

  // Call translation API
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, from, to }),
  });

  if (!res.ok) {
    throw new Error("Translation failed");
  }

  const data = await res.json();
  const translated = data.translatedText as string;

  // Save to cache
  cache[key] = { text: translated, timestamp: Date.now() };
  saveCache(cache);

  return translated;
}

/**
 * Translate multiple texts in a single batch (sequential to avoid rate limiting).
 */
export async function translateBatch(
  texts: string[],
  to: string = "ja",
  from: string = "en"
): Promise<string[]> {
  // Join with a separator that won't appear in normal text
  const separator = "\n|||SPLIT|||\n";
  const joined = texts.join(separator);

  const translated = await translateText(joined, to, from);
  return translated.split(/\|\|\|SPLIT\|\|\|/).map((t) => t.trim());
}
