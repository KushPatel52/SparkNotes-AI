/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./electron/renderer/**/*.{ts,tsx,js,jsx,html}"
  ],
  theme: {
    extend: {
      fontFamily: { sans: ["'Poppins'", "ui-sans-serif", "system-ui"] },
      colors: {
        lightPink:  "#ffe8ef",
        lightGreen: "#e8fff4",
      },
      backgroundImage: {
        hero: "linear-gradient(135deg, #040431 0%, #10105c 50%, #1b1bae 100%)",
      },
    },
  },
  plugins: [],
};
