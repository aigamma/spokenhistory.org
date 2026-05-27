/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand red. Passes WCAG AA only for LARGE text (18pt+, or
        // 14pt+ bold). Do NOT use for small body text on cream.
        'civil-red': '#F2483C',
        // Darker brand-adjacent red. 4.86:1 on cream (AA-compliant for
        // normal text), 4.57:1 as background with white text (just over
        // AA). Use this for small red labels and for filled-red buttons
        // that need to clear AA. 'civil-red-body' and 'civil-red-strong'
        // are both aliases for the same hex value, preserved so existing
        // code that references either name continues to work.
        'civil-red-body': '#B23E2F',
        'civil-red-strong': '#B23E2F',
        'civil-bg': '#EBEAE9',
        'civil-cream': '#EBEAE9',
      },
      fontFamily: {
        'heading': ['Acumin Pro', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'body': ['Source Serif 4', 'Lora', 'ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        'mono': ['Chivo Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      fontWeight: {
        'heading': '700', // Bold
        'body-medium': '500', // Medium
        'body-black': '900',  // Black
        'body': '400',    // Book/Regular
        'mono': '300',    // Light
      }
    },
  },
  plugins: [],
}