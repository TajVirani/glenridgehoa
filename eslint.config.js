import js from "@eslint/js";
import globals from "globals";

// Content is only ever written to the page as text. See CONTRIBUTING.md, "Rendering Content".
const textOnly = "Content is rendered with <template> + textContent. HTML string sinks are not allowed.";

export default [
  { ignores: ["design/", "node_modules/"] },

  js.configs.recommended,

  {
    files: ["site/assets/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, L: "readonly" },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "AssignmentExpression > MemberExpression.left[property.name=/^(innerHTML|outerHTML)$/]",
          message: textOnly,
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: textOnly,
        },
      ],
    },
  },

  {
    // Loaded as a blocking classic script so the theme exists before first paint.
    files: ["site/assets/js/theme.js"],
    languageOptions: { sourceType: "script" },
  },

  {
    files: ["eslint.config.js", ".github/scripts/**/*.js"],
    languageOptions: { globals: globals.node },
  },
];
