import { RefObject, useEffect, useRef, useState } from "react";

export type ElementSize = { width: number; height: number };

/**
 * Measures an element with ResizeObserver so the charts can rerender on any
 * size change (window resize, grid reflow, panel toggling). Returns 0×0
 * until the first measurement — charts skip rendering until then.
 */
export function useElementSize(): [
  RefObject<HTMLDivElement | null>,
  ElementSize,
] {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setSize((previous) => {
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        return previous.width === width && previous.height === height
          ? previous
          : { width, height };
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}
