import vue from "eslint-plugin-vue";
import ts from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import configPrettier from "eslint-config-prettier";
import vueParser from "vue-eslint-parser";

export default [
  ...vue.configs["flat/recommended"],
  {
    files: ["**/*.{js,ts,vue}"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        parser,
      },
    },
    plugins: {
      vue,
      "@typescript-eslint": ts,
      prettier,
    },
    rules: {
      ...ts.configs["eslint-recommended"].rules,

      // custom
      "vue/require-default-prop": "off",
      "vue/multi-word-component-names": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "vue/max-attributes-per-line": "off",
      "vue/attributes-order": [
        "error",
        {
          order: [
            "CONDITIONALS", // v-if, v-else-if, v-else
            "LIST_RENDERING", // v-for
            "RENDER_MODIFIERS", // v-once, v-pre
            "GLOBAL", // id
            "UNIQUE", // ref, key
            "SLOT", // v-slot
            "TWO_WAY_BINDING", // v-model
            "OTHER_DIRECTIVES", // v-bind, custom directive
            "OTHER_ATTR", // class, style, attrs thường
            "CONTENT", // v-text, v-html
            "EVENTS", // @click, @input
          ],
          alphabetical: false,
        },
      ],
    },
  },

  configPrettier, // tắt rule conflict với prettier
];
