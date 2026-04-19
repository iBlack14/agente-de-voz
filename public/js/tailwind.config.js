tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#cf00da",
                "primary-hover": "#e033ea",
                "secondary": "#7c3aed",
                "tertiary": "#00e5ff",
                "background": "#0a0118",
                "surface": "rgba(25, 2, 45, 0.6)",
                "surface-bright": "rgba(45, 5, 85, 0.7)",
                "surface-container": "rgba(35, 3, 60, 0.5)",
                "border": "rgba(255, 255, 255, 0.08)",
                "error": "#ff4d4d",
                "success": "#00ffcc"
            },
            fontFamily: {
                "sans": ["Inter", "system-ui", "-apple-system", "sans-serif"],
                "headline": ["Plus Jakarta Sans", "Inter", "sans-serif"],
                "mono": ["Fira Code", "monospace"]
            },
            boxShadow: {
                "glow": "0 0 20px rgba(207, 0, 218, 0.3)",
                "glow-lg": "0 0 40px rgba(207, 0, 218, 0.4)",
            }
        },
    },
};
