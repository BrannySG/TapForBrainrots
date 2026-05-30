const SUFFIXES = [
  "",
  "K",
  "M",
  "B",
  "T",
  "Qa",
  "Qn",
  "Sx",
  "Sp",
  "Oc",
  "No",
  "Dc",
];

/** Compact number formatting (e.g. 312540000000000000 -> "312.54Qn"). */
export function formatNumber(value: number): string {
  if (!isFinite(value)) return "0";
  const sign = value < 0 ? "-" : "";
  let n = Math.abs(value);
  if (n < 1000) {
    return sign + (Number.isInteger(n) ? n.toString() : n.toFixed(1));
  }
  let tier = Math.floor(Math.log10(n) / 3);
  tier = Math.min(tier, SUFFIXES.length - 1);
  n = n / Math.pow(1000, tier);
  return sign + n.toFixed(2) + SUFFIXES[tier];
}
