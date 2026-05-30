// Curated FX sprites used by the summon reveal. Vite resolves these to final
// asset URLs. Copied from `Available Assets/FX/` (originals untouched).
import radialGlowThick from "../assets/fx/radial_glow_thick.png";
import radialGlowSemi from "../assets/fx/radial_glow_semitrans.png";
import sparkle from "../assets/fx/sparkle.png";
import sheen from "../assets/fx/sheen.png";
import smoke from "../assets/fx/smoke.png";
import raysTriangle from "../assets/fx/rays_triangle.png";
import raysInner from "../assets/fx/rays_inner.png";
import raysOuter from "../assets/fx/rays_outer.png";
import raysHighlight from "../assets/fx/rays_highlight.png";

export const FX_SPRITES = {
  radialGlowThick,
  radialGlowSemi,
  sparkle,
  sheen,
  smoke,
  raysTriangle,
  raysInner,
  raysOuter,
  raysHighlight,
} as const;
