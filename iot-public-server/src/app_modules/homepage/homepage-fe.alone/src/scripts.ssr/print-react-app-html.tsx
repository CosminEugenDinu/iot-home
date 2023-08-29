import React from "react";
import * as ReactDomServer from "react-dom/server";

// disable console.log when running script locally
console.log = () => {};

import { App } from "../components/App";

function getReactAppHtml() {
  const ReactAppHtml = ReactDomServer.renderToString(React.createElement(App));
  return ReactAppHtml;
}

// the script generated from this entry-point is used for printing html string of this react application
process.stdout.write(getReactAppHtml());
