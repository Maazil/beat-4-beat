import type { RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";

// Eager load - needed for initial render
import App from "./pages/App";

export const routes: RouteDefinition[] = [
  {
    path: "/",
    component: App,
  },
  {
    path: "/login",
    component: lazy(() => import("./pages/auth/Login")),
  },
  {
    path: "/guest",
    component: lazy(() => import("./pages/auth/Guest")),
  },
  {
    path: "/room/:id",
    component: lazy(() => import("./pages/room/Room")),
  },
  {
    path: "/room/:id/host",
    component: lazy(() => import("./pages/room/HostWrapper")),
  },
  {
    path: "/create",
    component: lazy(
      () => import("./pages/dashboard/createRoom/CreateRoomWrapper")
    ),
  },
  {
    path: "/profile",
    component: lazy(() => import("./pages/Profile/ProfileWrapper")),
  },
  {
    path: "**",
    component: lazy(() => import("./pages/notfound/NotFound")),
  },
];
