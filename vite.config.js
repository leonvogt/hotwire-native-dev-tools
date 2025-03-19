import { resolve } from "path"
import { defineConfig } from "vite"
import { nodeResolve } from "@rollup/plugin-node-resolve"

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.js"),
      name: "HotwireNativeDevTools",
      fileName: (format) => `hotwire-native-dev-tools.${format}.js`,
      formats: ["es"],
    },
    outDir: "dist",
    minify: true,
    sourcemap: true,
  },
  plugins: [nodeResolve()],
})
