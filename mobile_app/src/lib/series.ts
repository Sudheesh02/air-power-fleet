/** Deterministic pseudo-history so sparklines/RUL charts are stable between renders. */
export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}
export function history(seed: string, end: number, drift: number, n = 14, noise = 0.012) {
  const r = seeded(seed);
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return end - drift * (1 - t) + end * noise * (r() - 0.5) * (i === n - 1 ? 0 : 1);
  });
}
