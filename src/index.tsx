/* @refresh reload */
import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import "solid-devtools";
import { render } from "solid-js/web";
import "./index.css";

import AppErrorBoundary from "./components/AppErrorBoundary";
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
//
// AppErrorBoundary wraps all of it rather than just the Router, so a synchronous
// throw in a provider's own render or mount lands on the fallback instead of on
// a blank page. It does not cover AuthProvider's async init — a rejected promise
// never reaches an ErrorBoundary, which is why that chain catches for itself.
// The fallback renders in place of the whole tree, so it can't reach
// useToast/useConfirm and doesn't try to.
render(
  () => (
    <MetaProvider>
      <AppErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <Router>{routes}</Router>
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </MetaProvider>
  ),
  root!,
);
