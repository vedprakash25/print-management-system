import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/themeContext";

export default function Navbar() {
  const { theme, toggle } = useTheme();

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-panel border-b border-border">
      <span className="font-semibold text-textPrimary">PMS</span>

      <button
        onClick={toggle}
        className="p-2 rounded hover:bg-input transition"
        title="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun
            className="text-textPrimary"
            size={18}
          />
        ) : (
          <Moon size={18} />
        )}
      </button>
    </nav>
  );
}
