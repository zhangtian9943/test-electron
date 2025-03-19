const { defineConfig } = require("vite");
const vue = require("@vitejs/plugin-vue");
const path = require("path");

module.exports = defineConfig({
  base: "./",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  build: {
    outDir: "dist",
    assetsDir: ".",
    rollupOptions: {
      output: {
        format: "cjs",
        manualChunks: {
          "element-plus": ["element-plus"],
          xlsx: ["xlsx"]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
