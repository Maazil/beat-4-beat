/* @refresh reload */
import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import "solid-devtools";
import { render } from "solid-js/web";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import { ToastProvider } from "./context/ToastContext";
import { routes } from "./routes";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

// Toasts and confirms sit *outside* the Router on purpose: several call sites
// toast and then navigate away (createRoom), and a confirm resolves after the
// route it was asked from may have unmounted. Nesting them inside would tear
// both down mid-flight.
render(
  () => (
    <MetaProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <Router>{routes}</Router>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </MetaProvider>
  ),
  root!,
);
