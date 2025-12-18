import { Route, Routes } from "react-router-dom";
import "./App.css";

import Home from "./components/home";
import { lazy, Suspense } from "react";

const Editor = lazy(() => import("./components/editor"));

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/editor"
        element={
          <Suspense fallback={<div>Loading editor…</div>}>
            <Editor />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default App;
