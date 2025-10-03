import canvaPlugin from "@canva/app-eslint-plugin";
import globals from "globals";

export default [
  {
    ignores: [
      "**/node_modules/",
      "**/dist",
      "**/*.d.ts",
      "**/*.config.*",

      // Root-level scripts/tools/temp files
      "check_*.js",
      "fix_*.js",
      "find_issue.js",
      "ensure_newline.js",
      "clean_file.js",
      "temp_*",
      "*.fixed",
      "temp_handle_mouse_down.js",

      // If you want to ignore all examples:
      "examples/**",
    ],
  },

  // Canva base config without strict i18n
  ...canvaPlugin.configs.apps_no_i18n,

  // Targeted relaxations for src
  {
    files: ["src/**/*"],
    rules: {
      "unicorn/filename-case": "off",
      "react/display-name": "off",
      "react/forbid-elements": "off",
      "no-restricted-syntax": "off",
      "no-empty": "warn",
      "default-case": "warn",
      "eqeqeq": "warn",
      "no-console": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      "formatjs/no-literal-string-in-jsx": "off",
    },
  },

  // Node scripts (allow require/console)
  {
    files: ["*.js", "scripts/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
      "no-undef": "off",
    },
  },
];
