import React from "react";
import { Route, Routes } from "react-router-dom";
import { PlanSummary } from "./planSummary";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

/**
 * Route wrapper for the plan summary page.
 * Renders PlanSummary for any subpath.
 */
export function PlanRoute() {
  useDocumentTitle("Planen din");
  return (
    <Routes>
      <Route path={"*"} element={<PlanSummary />} />
    </Routes>
  );
}
