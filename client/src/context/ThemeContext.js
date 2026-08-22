import { createContext } from "react";

// Lightweight dark-mode context - just tracks the current Bootstrap
// data-bs-theme value and a toggle function, no extra dependency needed.
const ThemeContext = createContext();

export default ThemeContext;
