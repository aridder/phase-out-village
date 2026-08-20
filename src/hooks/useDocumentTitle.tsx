import { useEffect } from "react";

/** The site name, appended to every page title. */
export const SITE = "Oljespillet";

/**
 * Sets the document title for the current page.
 *
 * Every route in this hash-routed app used to share one `<title>`: "Phase
 * Out Village", in English, on a Norwegian site. That is a WCAG 2.4.2
 * failure with a very concrete cost — a screen reader announces the title
 * on navigation, so moving from the map to the reckoning announced nothing
 * at all, and every entry in the browser history and every open tab looked
 * identical.
 *
 * Call it from the route component, so the title can use whatever that
 * route already computed: the field's name, the period's name, the year.
 *
 * @param title The page's own name. `undefined` while data is still
 *   loading, which leaves the previous title in place rather than flashing
 *   a bare site name.
 */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return;
    document.title = `${title} – ${SITE}`;
  }, [title]);
}
