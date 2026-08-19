import React from "react";
import { createRoot } from "react-dom/client";

import "./application.css";
import { HashRouter } from "react-router-dom";
import { Application } from "./components/app/application";
import { IconDefaults } from "./components/ui/icons";

createRoot(document.getElementById("app")!).render(
  <HashRouter>
    <IconDefaults>
      <Application />
    </IconDefaults>
  </HashRouter>,
);

if (window.location.search === "?debug") {
  localStorage.setItem("debug", "true");
  window.location.search = "";
}
