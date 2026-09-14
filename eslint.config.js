import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "coverage/**", "coverage-*/**"],
  },
  eslint.configs.recommended,
  {
    files: ["src/**/*.ts", "tests/**/*.ts", "tools/**/*.ts", "vitest.config.ts"],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-inferrable-types": "off",
    },
  },
  {
    // `ARCH#Item-3`: no-logging is architectural for the execution seam --
    // no logger/`console`/telemetry anywhere under `internal/execution`.
    files: ["src/internal/execution/**/*.ts"],
    rules: {
      "no-console": "error",
    },
  },
);
