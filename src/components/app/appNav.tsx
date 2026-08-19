import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LuChartNoAxesColumn,
  LuEllipsis,
  LuLightbulb,
  LuMap,
  LuRotateCcw,
  LuTable,
  LuTrendingDown,
  LuWind,
} from "react-icons/lu";
import { LuCircleHelp } from "react-icons/lu";
import { ApplicationContext } from "../../applicationContext";
import { MainButton } from "../ui/mainButton";
import { Brand } from "./brand";

/**
 * The application's ONE navigation.
 *
 * It used to have two. The front page and the cost page carried a four-item
 * site nav; the map, the periods and everything else carried a seven-item
 * game nav. Since "Grønt" and "Rådgiver" were linked from the site nav but
 * live on game pages, pressing either of them swapped the entire header —
 * four buttons became seven, a status bar appeared, and on a phone the row
 * broke onto a second line. Nothing had changed about where you were, so
 * the shifting chrome read as a bug.
 *
 * Now every page gets the same header. Three destinations — the three acts
 * of the thing — plus everything else behind one "Mer" menu. The game adds
 * its status bar and its next-step footer BELOW this; it never changes the
 * navigation itself.
 */
export function AppNav() {
  const { restart } = useContext(ApplicationContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on navigation and on a click anywhere outside the menu
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    function handle(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function go(path: string) {
    setOpen(false);
    navigate(path, { state: { from: location } });
  }

  return (
    <div className="header-bar">
      <Brand />
      <nav className="header-nav" aria-label="Hovedmeny">
        <MainButton
          icon={<LuTrendingDown />}
          label={"Norge i dag"}
          labelSmall={"Fakta"}
          title="Tallene for sokkelen slik den står i dag"
          to="/norge"
        />
        <MainButton
          icon={<LuMap />}
          label={"Kart"}
          labelSmall={"Kart"}
          title="Feltene på sokkelen"
          to="/map"
        />
        <MainButton
          icon={<LuChartNoAxesColumn />}
          label={"Planen din"}
          labelSmall={"Plan"}
          title="Se planen din"
          to="/plan"
        />

        <div className="nav-more" ref={menuRef}>
          <button
            type="button"
            className={open ? "main-button active" : "main-button"}
            aria-expanded={open}
            aria-haspopup="true"
            onClick={() => setOpen((value) => !value)}
            title="Mer"
          >
            <span className="icon" aria-hidden="true">
              <LuEllipsis />
            </span>
            <span className="label-large">Mer</span>
            <span className="label-small" aria-hidden="true">
              Mer
            </span>
          </button>

          {open && (
            <div className="nav-menu" role="menu">
              <button role="menuitem" onClick={() => go("/advisor")}>
                <LuLightbulb size={16} />
                Rådgiver
              </button>
              <button role="menuitem" onClick={() => go("/transition")}>
                <LuWind size={16} />
                Omstilling
              </button>
              <button role="menuitem" onClick={() => go("/kostnad")}>
                <LuTrendingDown size={16} />
                Hva koster det?
              </button>
              <button role="menuitem" onClick={() => go("/data")}>
                <LuTable size={16} />
                Alle tallene
              </button>
              <button role="menuitem" onClick={() => go("/tutorial")}>
                <LuCircleHelp size={16} />
                Slik spiller du
              </button>
              <div className="nav-menu-divider" />
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  restart();
                }}
              >
                <LuRotateCcw size={16} />
                Start på nytt
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
