import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// In production: set VITE_API_URL to your Railway backend URL
// In development: defaults to localhost:3000
const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
setBaseUrl(apiUrl);

createRoot(document.getElementById("root")!).render(<App />);
