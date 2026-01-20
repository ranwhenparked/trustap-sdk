import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    testTimeout: 10000,
    hookTimeout: 5000,
    exclude: ["src/__tests__/deno/**", "**/node_modules/**"],
    env: {
      NODE_ENV: "test",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "src/__tests__/**",
        "src/schema.d.ts",
        "src/operations-map.ts",
        "src/security-map.ts",
        "scripts/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
