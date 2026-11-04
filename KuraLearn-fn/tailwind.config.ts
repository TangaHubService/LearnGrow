import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F2937",
        sky: "#38BDF8",
        leaf: "#22C55E",
        mango: "#F59E0B",
        berry: "#EC4899",
        // Premium Curated Hues
        slate: {
          150: "#eef1f6",
          450: "#7c8ba1",
          550: "#5f718c",
          650: "#475870",
          755: "#2d3c52",
          850: "#182436",
        },
        indigo: {
          650: "#4636d9",
          655: "#3b2dbf",
          750: "#281b99",
        },
        teal: {
          650: "#0b8a7d",
        }
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"]
      },
      // Globals scaled-up font size mappings for all body/descriptive texts
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.375" }],   // ~13px instead of 12px
        sm: ["0.9375rem", { lineHeight: "1.5" }],     // ~15px instead of 14px
        base: ["1.0625rem", { lineHeight: "1.625" }], // ~17px instead of 16px
        lg: ["1.1875rem", { lineHeight: "1.75" }],    // ~19px instead of 18px
      }
    }
  },
  plugins: []
} satisfies Config;
