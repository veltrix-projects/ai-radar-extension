import { StrictMode } from "react";
import { createRoot }  from "react-dom/client";
import ArchiveApp      from "./ArchiveApp.jsx";
createRoot(document.getElementById("root")).render(<StrictMode><ArchiveApp /></StrictMode>);
