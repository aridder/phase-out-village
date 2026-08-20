import { useEffect, useState } from "react";

const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

/**
 * Whether the user has asked their system to reduce motion.
 *
 * CSS handles most of this (see the `prefers-reduced-motion` block in
 * application.css), but an animation driven from JavaScript — a typewriter
 * revealing text a character at a time, say — is invisible to CSS and has
 * to ask for itself.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(mediaQuery.matches);

  useEffect(() => {
    function handleChange(event: MediaQueryListEvent) {
      setReduced(event.matches);
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reduced;
}
