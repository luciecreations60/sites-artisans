import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    // OneDrive + dépôts Unsplash dans public/img provoquent EBUSY sur le watcher Windows
    watch: {
      ignored: ["**/public/img/**"],
    },
  },
});
