import type { RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";

// Eager load - needed for initial render
import App from "./pages/App";

export const routes: RouteDefinition[] = [
  // Public routes
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
    path: "/market",
    component: lazy(() => import("./pages/market/MarketWrapper")),
    children: [
      {
        path: "/",
        component: lazy(() => import("./pages/market/market")),
      },
    ],
  },

  // Room routes (public/guest accessible)
  {
    path: "/rooms",
    component: lazy(() => import("./pages/rooms/RoomsWrapper")),
    children: [
      {
        path: "/",
        component: lazy(() => import("./pages/rooms/RoomsList")),
      },
      {
        path: "/:id",
        component: lazy(() => import("./pages/rooms/RoomView")),
      },
      {
        path: "/:id/play",
        component: lazy(() => import("./pages/rooms/RoomPlay")),
      },
    ],
  },

  // Protected routes (require authentication)
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
          () => import("./pages/dashboard/create/CreateRoomWrapper")
        ),
      },
    ],
  },
  {
    path: "/profile",
    component: lazy(() => import("./pages/profile/ProfileWrapper")),
    children: [
      {
        path: "/",
        component: lazy(() => import("./pages/profile/profile")),
      },
    ],
  },

  // Fallback
  {
    path: "**",
    component: lazy(() => import("./pages/notfound/NotFound")),
  },
];
