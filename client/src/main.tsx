import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.title = "CRM System";

createRoot(document.getElementById("root")!).render(<App />);
