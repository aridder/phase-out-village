import React from "react";
import { createRoot } from "react-dom/client";

import "./application.css";
import { HashRouter } from "react-router-dom";
import { Application } from "./components/app/application";
import { IconDefaults } from "./components/ui/icons";
import { ErrorBoundary } from "./components/app/errorBoundary";

createRoot(document.getElementById("app")!).render(
  <ErrorBoundary>
    <HashRouter>
      <IconDefaults>
        <Application />
      </IconDefaults>
    </HashRouter>
  </ErrorBoundary>,
);

if (window.location.search === "?debug") {
  try {
    localStorage.setItem("debug", "true");
  } catch {
    // Storage blocked by the browser; debug mode simply stays off
  }
  window.location.search = "";
}
