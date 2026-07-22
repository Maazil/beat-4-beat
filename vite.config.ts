import tailwindcss from "@tailwindcss/vite";
import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [devtools(), solidPlugin(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 3000,
  },
  // No build.target override: Vite's baseline default keeps the output
  // parseable on older mobile Safari/Chrome (esnext syntax blanks the page).
  build: {
    rollupOptions: {
      output: {
        // Split the Firebase SDKs into stable, individually-cacheable vendor
        // chunks. Auth and Firestore are only ever reached through dynamic
        // imports (AuthContext / the data services), so isolating them keeps
        // each off the landing critical path and lets one change to app code
        // avoid busting the (large, rarely-changing) SDK caches.
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("@firebase/firestore") || id.includes("firebase/firestore")) {
              return "firebase-firestore";
            }
            if (id.includes("@firebase/auth") || id.includes("firebase/auth")) {
              return "firebase-auth";
            }
          }
          return undefined;
        },
      },
    },
  },
});
