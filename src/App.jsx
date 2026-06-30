import { Route, Routes } from "react-router-dom";
import "./App.css";
import EditorPage from "./pages/EditorPage";
import DocumentationPage from "./pages/DocumentationPage";
import { AuthProvider } from "./auth/AuthProvider";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/how-to-use" element={<DocumentationPage />} />
        <Route path="*" element={<DocumentationPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

