import ReactDOM from "react-dom/client";

import React from "react";
import { StrictMode } from "react";

import APP from "./app.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <APP />
  </StrictMode>
);
