import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

const forPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: forPages ? "/sites-artisans/" : "/",
  plugins: [reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
