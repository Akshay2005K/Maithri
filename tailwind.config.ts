import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      dusk: "rgb(var(--rgb-dusk) / <alpha-value>)",
      fog: "rgb(var(--rgb-fog) / <alpha-value>)",
      ink: "rgb(var(--rgb-ink) / <alpha-value>)",
      teal: "rgb(var(--rgb-teal) / <alpha-value>)",
      marigold: "rgb(var(--rgb-marigold) / <alpha-value>)",
      surface: "rgb(var(--rgb-surface) / <alpha-value>)",
      muted: "rgb(var(--rgb-muted) / <alpha-value>)",
      border: "rgb(var(--rgb-border) / <alpha-value>)",
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-bricolage)", "system-ui", "sans-serif"],
        serif: ["var(--font-literata)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
