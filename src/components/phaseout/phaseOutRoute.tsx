import React from "react";
import { useLocation } from "react-router-dom";
import { PhaseOutDialog } from "./phaseOutDialog";

/**
 * The field selector as a full page rather than a modal over the map.
 *
 * It used to be a dialog on top of the map, which meant the period's main
 * action was squeezed into a scrolling box over a background the player
 * could not use. The choice deserves the whole screen; the map is one
 * click away and keeps its own page.
 */
export function PhaseOutRoute() {
  const location = useLocation();
  const from = location.state?.from?.pathname || "/map";
  return <PhaseOutDialog from={from} />;
}
