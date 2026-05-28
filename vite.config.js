import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// יעד ה-proxy ל-/api → backend.
// סדר קדימויות: VITE_BACKEND_PROXY → 3028 (ה-port שבו ה-backend רץ אצלך) → 5055.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget =
    env.VITE_BACKEND_PROXY || "http://localhost:3028";

  return {
    plugins: [react()],
    base: "/",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
    },
    server: {
      port: 4106,
      historyApiFallback: true,
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
