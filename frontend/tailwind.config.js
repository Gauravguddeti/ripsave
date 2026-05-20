/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        blue: "#0044FF",
        yellow: "#FFCC00",
        bg: "#F4F4F0",
        ink: "#0A0A0A",
      },
      fontFamily: {
        display: ['"Archivo Black"', '"Arial Black"', "system-ui", "sans-serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        none: "0px",
        DEFAULT: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        full: "0px",
      },
      boxShadow: {
        brutal: "6px 6px 0 #0A0A0A",
        "brutal-sm": "4px 4px 0 #0A0A0A",
        "brutal-blue": "6px 6px 0 #0044FF",
        "brutal-yellow": "4px 4px 0 #FFCC00",
      },
    },
  },
  plugins: [],
};
