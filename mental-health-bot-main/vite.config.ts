import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("recharts")) return "charts";
          if (id.includes("jspdf")) return "pdf";
          if (id.includes("html2canvas")) return "html2canvas";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("react-router")) return "router";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("react")) return "react-vendor";
          if (id.includes("@radix-ui") || id.includes("lucide-react")) return "ui-vendor";
        },
      },
    },
  },
}));
