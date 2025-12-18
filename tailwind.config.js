/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                app: "rgb(var(--bg-app))",
                panel: "rgb(var(--bg-panel))",
                input: "rgb(var(--bg-input))",

                border: "rgb(var(--border))",

                textPrimary: "rgb(var(--text-primary))",
                textSecondary: "rgb(var(--text-secondary))",

                primary: "rgb(var(--primary))",
                danger: "rgb(var(--danger))",
                success: "rgb(var(--success))",
            },
        },
    },
    plugins: [],
};
