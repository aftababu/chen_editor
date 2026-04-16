import { Route, Routes } from "react-router-dom";
import "./App.css";
import ChenEditor from "./chen_editor";
import Documentation from "./how_to_use";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<ChenEditor />} />
        <Route path="/how-to-use" element={<Documentation />} />
        <Route path="*" element={<Documentation />} />
      </Routes>
    </>
  );
}

export default App;
