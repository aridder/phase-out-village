import React from "react";
import { Outlet } from "react-router-dom";
import { AppNav } from "./appNav";

/**
 * Layout for the pages outside the game loop: the title screen, Act 1, the
 * cost calculator and the tutorial.
 *
 * It shares its navigation with the game (see {@link AppNav}) and differs
 * only in what it leaves out — no status bar, no next-step footer. That is
 * the whole distinction now; the header itself is identical everywhere.
 */
export function SiteLayout() {
  return (
    <>
      <header>
        <AppNav />
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
