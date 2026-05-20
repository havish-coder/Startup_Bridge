/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind scans these files and includes only the CSS classes actually used.
  // If you add a new folder, add it here too.
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // Add brand colours here later if you want a custom accent
    },
  },
  plugins: [],
}
