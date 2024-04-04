import { readPackageUpSync } from "read-package-up";
import { resolveExports } from "resolve-pkg-maps";
import { defineConfig } from "vitest/config";

/**
 * @param {ImportMeta} meta
 * @returns
 */
export default function (meta) {
  const pkg = readPackageUpSync({ cwd: meta.url });
  const exports = pkg?.packageJson.exports;
  const maps = resolveExports(exports);

  return defineConfig({
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
        entry: entries,
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
}
