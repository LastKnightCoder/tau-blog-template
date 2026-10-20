import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "slate",
      "slate-react",
      "react-dnd",
      "react-dnd-html5-backend",
    ],
    alias: { "@blog": resolve(__dirname, "src") },
  },
  build: {
    outDir: "dist/site",
    emptyOutDir: true,
    // 确保所有 CSS 合并到一个文件中，避免外部 CSS 导入问题
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        // 确保所有模块打包到一起
        manualChunks: undefined,
      },
    },
  },
  // 确保外部包的样式也被处理
  optimizeDeps: {
    include: ["@tau/blog"],
  },
});
