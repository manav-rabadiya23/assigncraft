import { BrowserRouter, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import WhyAssignCraftPage from "./pages/WhyAssignCraftPage";
import FeaturesPage from "./pages/FeaturesPage";
import AboutPage from "./pages/AboutPage";
import ContinueAssignmentPage from "./pages/ContinueAssignmentPage";
import JupyterToolsPage from "./pages/JupyterToolsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/continue-assignment"
          element={<ContinueAssignmentPage />}
        />
        <Route path="/jupyter-tools" element={<JupyterToolsPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/why-assigncraft" element={<WhyAssignCraftPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  );
}
