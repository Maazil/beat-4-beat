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
});
