import { createRoot } from "react-dom/client";
import { App } from "./app.jsx";
import "./menuKeys.js"; // keyboard support for every menu and list (see the file)
import "./dialogKeys.js"; // Escape closes the dialog on top (see the file)

createRoot(document.getElementById("root")).render(<App />);
