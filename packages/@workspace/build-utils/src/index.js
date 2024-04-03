import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.spec.ts"],
    includeSource: ["src/**/*.ts"],
    onStackTrace: (_, { file }) => {
      if (file.includes("@workspace")) {
        return false;
      }
    },
  },

  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },

    minify: true,
    terserOptions: {
      compress: {
        reduce_funcs: true,
        unsafe_arrows: true,
        passes: 2,
      },
    },
  },

  define: {
    "import.meta.vitest": "undefined",
  },
});
