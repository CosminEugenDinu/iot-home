import { StrictMode } from "react";
import * as ReactDomClient from "react-dom/client";

import { App } from "./components/App";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDomClient.hydrateRoot(
    rootElement,
    <StrictMode>
      <App />
    </StrictMode>
  );
}
