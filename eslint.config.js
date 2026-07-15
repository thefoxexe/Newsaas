import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // src/templates/_shared/*.js: vanilla browser runtime scripts inlined
    // directly into rendered template HTML (see render-html.ts) — plain JS
    // with no type information, same category as every template's own
    // inline <script> blocks, which are embedded in .html and never linted
    // either.
    ignores: ["dist/**", "node_modules/**", "out/**", ".next/**", "next-env.d.ts", "src/templates/_shared/*.js"],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "eslint.config.js",
            "vitest.config.ts",
            "drizzle.config.ts",
            "next.config.mjs",
            "postcss.config.mjs",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
      "no-console": "error",
    },
  },
);
