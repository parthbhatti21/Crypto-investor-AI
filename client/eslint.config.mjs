import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React compiler rules fire false positives on valid async setState patterns
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      // Disable component-in-render rule (false positive on inline icon components)
      "react-hooks/no-nested-components": "off",
      // Allow explicit any — we use it intentionally for Soroban return values
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/static-components": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
]);

export default eslintConfig;
