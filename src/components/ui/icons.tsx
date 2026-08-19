import React from "react";
import {
  LuArrowRight,
  LuCar,
  LuCircleCheck,
  LuCoins,
  LuCompass,
  LuFish,
  LuHardHat,
  LuPlane,
  LuTreePine,
  LuTriangleAlert,
  LuWrench,
  LuX,
} from "react-icons/lu";
import { IconContext } from "react-icons";

/**
 * The app's icon system.
 *
 * One set — Lucide, via `react-icons/lu`. It is a single 24×24 grid with a
 * uniform stroke and no fills, which is the only thing in the bundle that
 * sits next to the hand-drawn illustrations without a visible seam. The
 * app previously mixed five sets (fa, fa6, md, bi, rx) plus one
 * full-colour icon, plus about seventy emoji.
 *
 * Rules, so this cannot drift again:
 *
 *  - Three sizes only: 14 inline with text, 16 in buttons, 20 as a section
 *    marker. Anything larger is an illustration, not an icon.
 *  - Colour is always `currentColor`. A decorative icon is dimmed with
 *    opacity, never tinted — colour in this app carries data, not mood.
 *  - Every icon is `aria-hidden`; the label always exists as real text.
 *
 * Data modules refer to icons by KEY rather than importing components, so
 * they stay plain serialisable data. {@link Icon} resolves the key.
 */

/** Every icon a data module is allowed to ask for. */
export type IconKey =
  | "kompass"
  | "advarsel"
  | "ok"
  | "verktoy"
  | "penger"
  | "hjelm"
  | "bil"
  | "fly"
  | "tre"
  | "fisk"
  | "pil"
  | "lukk";

const registry: Record<IconKey, React.ComponentType<{ size?: number }>> = {
  kompass: LuCompass,
  advarsel: LuTriangleAlert,
  ok: LuCircleCheck,
  verktoy: LuWrench,
  penger: LuCoins,
  hjelm: LuHardHat,
  bil: LuCar,
  fly: LuPlane,
  tre: LuTreePine,
  fisk: LuFish,
  pil: LuArrowRight,
  lukk: LuX,
};

export type IconSize = 14 | 16 | 20;

/**
 * Renders one icon from the registry. Decorative by default — pass a
 * `title` only when the icon is the sole carrier of meaning, which should
 * be almost never.
 */
export function Icon({
  name,
  size = 16,
  muted = false,
  className,
}: {
  name: IconKey;
  size?: IconSize;
  muted?: boolean;
  className?: string;
}) {
  const Component = registry[name];
  if (!Component) return null;
  return (
    <span
      className={["icon", muted ? "icon-muted" : "", className]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <Component size={size} />
    </span>
  );
}

/**
 * Sets the stroke weight for every Lucide icon in the tree.
 *
 * 1.75 rather than Lucide's default 2: at 14–16 px a 2 px stroke reads
 * heavier than the 20 px text beside it, and the icons started to shout.
 */
export function IconDefaults({ children }: { children: React.ReactNode }) {
  return (
    <IconContext.Provider
      value={{ style: { strokeWidth: 1.75 }, className: "lucide" }}
    >
      {children}
    </IconContext.Provider>
  );
}
