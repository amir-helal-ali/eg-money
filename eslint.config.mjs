import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // ===== TypeScript rules (re-enabled — these catch real bugs) =====
    // Warn on `any` (don't error — too many existing uses to fix at once)
    "@typescript-eslint/no-explicit-any": "warn",
    // Error on unused vars (catches dead code + bugs)
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-non-null-assertion": "off", // many legitimate uses in this codebase
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",

    // ===== React rules (re-enabled — exhaustive-deps catches real stale-closure bugs) =====
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",

    // ===== Next.js rules =====
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",

    // ===== General JavaScript rules (re-enabled — these are bug-catchers) =====
    "prefer-const": "warn",
    "no-unused-vars": "off", // handled by @typescript-eslint/no-unused-vars
    "no-console": "off", // we use console.error for logging; could be tightened later
    "no-debugger": "error",
    "no-empty": "warn",
    "no-irregular-whitespace": "error",
    "no-case-declarations": "off",
    "no-fallthrough": "error", // catches missing break in switch
    "no-mixed-spaces-and-tabs": "error",
    "no-redeclare": "off", // handled by TS
    "no-undef": "off", // handled by TS
    "no-unreachable": "error", // catches code after return/throw
    "no-useless-escape": "warn",
  },
}, {
  ignores: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "examples/**",
    "skills",
    "mini-services/**", // has its own package.json + deps
    "tests/**", // test files use their own conventions
  ]
}];

export default eslintConfig;
