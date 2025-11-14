/* @refresh reload */
import { Route, Router } from "@solidjs/router";
import "solid-devtools";
import { render } from "solid-js/web";
import "./index.css";

import App from "./routes/App";
import CreateRoom from "./routes/Dashboard/CreateRoom/CreateRoom";
import Dashboard from "./routes/Dashboard/Dashboard";
import PageWrapper from "./routes/Dashboard/PageWrapper";
import Play from "./routes/Dashboard/Rooms/:id/play/Play";
import Room from "./routes/Dashboard/Rooms/:id/Room";
import Rooms from "./routes/Dashboard/Rooms/Rooms";
import NotFound from "./routes/NotFound/NotFound";
import Profile from "./routes/Profile/Profile";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

render(
  () => (
    <Router>
      <Route path="/" component={App} />
      <Route path="/dashboard" component={PageWrapper}>
        <Route path="/" component={Dashboard} />
        <Route path="rooms">
          <Route path="/" component={Rooms} />
          <Route path=":id" component={Room} />
          <Route path=":id/play" component={Play} />
        </Route>
        <Route path="profile" component={Profile} />
        <Route path="create" component={CreateRoom} />
      </Route>
      <Route path="*" component={NotFound} />
    </Router>
  ),
  root!
);
