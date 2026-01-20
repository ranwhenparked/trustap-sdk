import baseConfig from "@rwp/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [
      "dist/**",
      "scripts/**",
      "src/schema.d.ts",
      "src/__tests__/deno/**",
    ],
  },
  ...baseConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "sonarjs/function-return-type": "error",
    },
  },
];

