import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { FileProvider } from "./context/fileContext";
import { ThemeProvider } from "./context/themeContext";
import Navbar from "./components/navbar";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <FileProvider>
          <Navbar />
          <App />
        </FileProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
