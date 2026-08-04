import {
  defineConfig,
  presetUno,
  presetIcons,
  presetAttributify,
  transformerVariantGroup,
  transformerDirectives,
} from "unocss";
import { colors } from "unocss/preset-mini";

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  theme: {
    colors: {
      ...colors,
      "on-surface": "#1b1c1c",
      "tertiary-fixed": "#c8e6ff",
      "on-primary-fixed": "#4f2418",
      "tertiary-container": "#104764",
      outline: "#b89a91",
      "surface-container": "#f4efed",
      secondary: "#8a4a2a",
      "surface-variant": "#f2e6e2",
      "surface-container-low": "#f6f3f2",
      "surface-container-highest": "#f2e6e2",
      "surface-container-high": "#f7eeeb",
      surface: "#fbf9f8",
      primary: "#d85510",
      tertiary: "#003047",
      "on-surface-variant": "#6b554f",
      "outline-variant": "#e6cfc8",
      "primary-container": "#cf7b5a",

      neutral: "#333333",
      "third-dark": "#505050",
      "third-light": "#B6B6B6",
      danger: "#ba1a1a",
      "surface-light": "#F5F5F5",
      "bg-body": "#efe9e5",
      "bg-cart": "#faf9f7",
    },
    borderRadius: {
      DEFAULT: "0.5rem",
      lg: "0.5rem",
      xl: "0.75rem",
      full: "9999px",
    },
    fontFamily: {
      sans: ["Manrope", "sans-serif"],
      noto: ["Noto Serif", "serif"],
    },
  },
  shortcuts: {
    "border-base": "border-(1px solid third-light)",
    "cms-title": "text-xl lg:text-3xl text-on-surface font-semibold",
    "center-child": "flex items-center justify-center",
    "scrollbar-none": "scrollbar-width-none [&::-webkit-scrollbar]:hidden",
    "gradient-primary": "bg-gradient-to-r from-primary to-primary-container",
  },
  variants: [
    (matcher) => {
      if (!matcher.startsWith("touch-device:")) return matcher;
      return {
        matcher: matcher.slice("touch-device:".length),
        parent: "@media (hover: none)",
      };
    },
  ],
  transformers: [transformerVariantGroup(), transformerDirectives()],
});
