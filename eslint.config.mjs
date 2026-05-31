import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Reading a client-only value (localStorage, window.location) in an effect
      // and setting state is intentional here: it defers the value to after
      // hydration so server and client first renders match. Initializing that
      // state synchronously would reintroduce hydration mismatches, so we keep
      // the pattern and treat this rule as advisory rather than a build blocker.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
