const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          superLight: "#eef2ff",
          light: "#818cf8",
          DEFAULT: "#4f46e5",
          dark: "#3730a3",
        },
        success: {
          DEFAULT: "#10b981",
          dark: "#065f46",
        },
        danger: {
          DEFAULT: "#ef4444",
          dark: "#991b1b",
        },
      },
      fontFamily: {
        sans: ["Assistant", "sans-serif"],
      },
      screens: {
        xs: "420px",
        sm: "640px",
        md: "768px",
        ipad: { min: "768px", max: "1199px" },
        lg: "1024px",
        xl: "1280px",
      },
    },
  },
  plugins: [],
};
