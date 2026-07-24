import type { RouteDefinition, RoutePreloadFuncArgs } from "@solidjs/router";
import { lazy } from "solid-js";

// Eager load - needed for initial render
import App from "./pages/App";

// Warm the shared room queries on link intent so the page renders without a
// cold round-trip. Dynamic import keeps Firestore out of the entry chunk.
// The category images live in their own document, so they're a second read —
// warming both here keeps the board views at one round trip's latency.
const preloadRoom = ({ params }: RoutePreloadFuncArgs) => {
  const id = params.id;
  if (!id) return;
  void import("./services/roomQuery").then(({ getRoomOnce, getCategoryImagesOnce }) => {
    void getRoomOnce(id);
    void getCategoryImagesOnce(id);
  });
};

const devOnlyRoutes: RouteDefinition[] = import.meta.env.DEV
  ? [
      {
        path: "/ui-preview",
        component: lazy(() => import("./pages/ui-preview/UIPreview")),
      },
      {
        path: "/forms-preview",
        component: lazy(() => import("./pages/forms-preview/FormsPreview")),
      },
      {
        path: "/spotify-test",
        component: lazy(() => import("./pages/spotify-test/SpotifyTest")),
      },
    ]
  : [];

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
    path: "/login/finish",
    component: lazy(() => import("./pages/auth/FinishEmailSignIn")),
  },
  {
    path: "/host-guide",
    component: lazy(() => import("./pages/host-guide/HostGuide")),
  },

  // Protected routes (require authentication)
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
    path: "/rooms",
    component: lazy(() => import("./pages/dashboard/PageWrapper")),
    children: [
      {
        path: "/",
        component: lazy(() => import("./pages/rooms/RoomsList")),
      },
      {
        path: "/:id",
        component: lazy(() => import("./pages/rooms/RoomView")),
        preload: preloadRoom,
      },
      {
        path: "/:id/play",
        component: lazy(() => import("./pages/rooms/RoomPlay")),
        preload: preloadRoom,
      },
      {
        path: "/:id/watch",
        component: lazy(() => import("./pages/rooms/AudienceView")),
        preload: preloadRoom,
      },
    ],
  },

  {
    path: "/dashboard",
    component: lazy(() => import("./pages/dashboard/PageWrapper")),
    children: [
      {
        path: "/",
        component: lazy(() => import("./pages/dashboard/Dashboard")),
      },
      {
        path: "/create",
        component: lazy(() => import("./pages/dashboard/create/CreateRoomWrapper")),
        children: [
          {
            path: "/",
            component: lazy(() => import("./pages/dashboard/create/createRoom")),
          },
        ],
      },
    ],
  },
  // Co-owner invite links (require authentication)
  {
    path: "/invite/:roomId/:token",
    component: lazy(() => import("./pages/invite/InviteAccept")),
  },
  {
    path: "/profile",
    component: lazy(() => import("./pages/profile/ProfileWrapper")),
    children: [
      {
        path: "/",
        component: lazy(() => import("./pages/profile/Profile")),
      },
    ],
  },

  // Development-only showcases — omitted from the production build so they
  // fall through to the NotFound fallback.
  ...devOnlyRoutes,

  // Fallback
  {
    path: "**",
    component: lazy(() => import("./pages/notfound/NotFound")),
  },
];
