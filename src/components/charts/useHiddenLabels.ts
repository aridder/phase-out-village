import { useState } from "react";

/**
 * The clickable-legend state shared by the line and bar charts: a set of
 * hidden series labels and a toggle. Scatter has no legend, so it doesn't
 * use this.
 */
export function useHiddenLabels(): {
  hidden: ReadonlySet<string>;
  toggle: (label: string) => void;
} {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const toggle = (label: string) =>
    setHidden((previous) => {
      const next = new Set(previous);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  return { hidden, toggle };
}
