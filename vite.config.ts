import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/*/tests/**/*.spec.ts"],
    includeSource: ["packages/*/*/src/**/*.ts"],

    onStackTrace: (_, { file }) => {
      if (file.includes("@workspace")) {
        return false;
      }
    },
  },
});
