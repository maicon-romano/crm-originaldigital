import { createRoot } from "react-dom/client";
import { AppWithProviders } from "./App";
import "./index.css";

document.title = "CRM System";

createRoot(document.getElementById("root")!).render(<AppWithProviders />);
