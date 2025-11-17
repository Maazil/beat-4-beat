/* @refresh reload */
import { Route, Router } from "@solidjs/router";
import "solid-devtools";
import { render } from "solid-js/web";
import "./index.css";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import App from "./pages/App";
import CreateRoom from "./pages/Dashboard/CreateRoom/CreateRoom";
import Dashboard from "./pages/Dashboard/Dashboard";
import PageWrapper from "./pages/Dashboard/PageWrapper";
import Host from "./pages/Dashboard/Rooms/:id/play/Host";
import Room from "./pages/Dashboard/Rooms/:id/Room";
import Rooms from "./pages/Dashboard/Rooms/Rooms";
import NotFound from "./pages/NotFound/NotFound";
import Play from "./pages/Play/Play";
import Profile from "./pages/Profile/Profile";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

render(
  () => (
    <AuthProvider>
      <Router>
        <Route path="/" component={App} />
        <Route path="/play/:id" component={Play} />
        <Route
          path="/dashboard"
          component={(props) => (
            <ProtectedRoute>
              <PageWrapper {...props} />
            </ProtectedRoute>
          )}
        >
          <Route path="/" component={Dashboard} />
          <Route path="rooms">
            <Route path="/" component={Rooms} />
            <Route path=":id" component={Room} />
            <Route path=":id/host" component={Host} />
          </Route>
          <Route path="profile" component={Profile} />
          <Route path="create" component={CreateRoom} />
        </Route>
        <Route path="*" component={NotFound} />
      </Router>
    </AuthProvider>
  ),
  root!
);
