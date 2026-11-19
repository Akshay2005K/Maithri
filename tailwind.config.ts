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
      dusk: "#2B2A5C",
      fog: "#EEF0F6",
      ink: "#1B1B2F",
      teal: "#1F9E9A",
      marigold: "#F2A93B",
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
