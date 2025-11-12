/* @refresh reload */
import "./index.css";
import { render } from "solid-js/web";
import "solid-devtools";
import { Route, Router } from "@solidjs/router";

import App from "./routes/App";
import Dashboard from "./routes/Dashboard";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

const routes = [
  { path: "/", component: App },
  { path: "/dashboard", component: Dashboard },
  { path: "*", component: () => <div>Not Found</div> },
];

render(() => <Router>{routes}</Router>, root!);
