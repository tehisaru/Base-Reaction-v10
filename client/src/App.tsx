import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import ClassicMode from "./pages/ClassicMode";
import BaseReactionMode from "./pages/BaseReactionMode";
import NotFound from "./pages/not-found";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/classic" element={<ClassicMode />} />
        <Route path="/base-reaction" element={<BaseReactionMode />} />
        <Route path="/tutorial" element={<Navigate to="/" replace />} />
        <Route path="/tutorial/:mode" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
