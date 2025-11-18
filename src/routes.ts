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
    path: "/market",
    component: lazy(() => import("./pages/market/MarketWrapper")),
    children: [
      {
        path: "/",
        component: lazy(() => import("./pages/market/market")),
      },
    ],
  },
  {
    path: "/dashboard",
    component: lazy(() => import("./pages/dashboard/PageWrapper")),
    children: [
      {
        path: "/",
        component: lazy(() => import("./pages/dashboard/dashboard")),
      },
      {
        path: "/create",
        component: lazy(
          () => import("./pages/dashboard/createRoom/CreateRoomWrapper")
        ),
      },
      {
        path: "/rooms",
        component: lazy(() => import("./pages/dashboard/rooms/Rooms")),
      },
      {
        path: "/rooms/:id",
        component: lazy(() => import("./pages/dashboard/rooms/:id/Room")),
      },
      {
        path: "/rooms/:id/play",
        component: lazy(() => import("./pages/dashboard/rooms/:id/play/Play")),
      },
    ],
  },
  {
    path: "/guest",
    component: lazy(() => import("./pages/auth/Guest")),
  },
  {
    path: "/rooms",
    component: lazy(() => import("./pages/dashboard/PageWrapper")),
    children: [
      {
        path: "/",
        component: lazy(() => import("./pages/dashboard/rooms/Rooms")),
      },
    ],
  },
  {
    path: "/r/:id",
    component: lazy(() => import("./pages/dashboard/rooms/:id/Room")),
  },
  {
    path: "/r/:id/play",
    component: lazy(() => import("./pages/dashboard/rooms/:id/play/Play")),
  },

  {
    path: "/profile",
    component: lazy(() => import("./pages/profile/ProfileWrapper")),
    children: [
      {
        path: "/",
        component: lazy(() => import("./pages/profile/profile")),
      },
      // {
      //   path: "/settings",
      //   component: lazy(() => import("./pages/profile/settings")),
      // },
    ],
  },
  {
    path: "**",
    component: lazy(() => import("./pages/notfound/NotFound")),
  },
];
