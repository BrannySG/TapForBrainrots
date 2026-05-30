// Brainrot character sprites. Vite eagerly resolves every PNG in the folder to
// its final asset URL; the map is keyed by the filename stem, which matches the
// brainrot `id` in src/core/config/brainrots.ts (e.g. "cappuccino_assassino").
const modules = import.meta.glob("../assets/brainrots/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export const BRAINROT_ICONS: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const id = path.split("/").pop()!.replace(/\.png$/, "");
  BRAINROT_ICONS[id] = url;
}

/** Sprite URL for a brainrot id, or undefined if no art is present. */
export function brainrotIcon(id: string): string | undefined {
  return BRAINROT_ICONS[id];
}
