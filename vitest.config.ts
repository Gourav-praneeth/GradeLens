import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "react",
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    env: {
      DATABASE_URL: "postgresql://gradelens:gradelens@127.0.0.1:5432/gradelens_test",
      DATABASE_URL_UNPOOLED: "postgresql://gradelens:gradelens@127.0.0.1:5432/gradelens_test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
