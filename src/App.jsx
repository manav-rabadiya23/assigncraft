import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import WhyAssignCraftPage from "./pages/WhyAssignCraftPage";
import FeaturesPage from "./pages/FeaturesPage";
import AboutPage from "./pages/AboutPage";
import VerificationPopup from "./components/VerificationPopup";
import ScrollToTop from "./components/ScrollToTop";

// Python-specific tools live in src/python and are loaded only when opened.
const ContinueAssignmentPage = lazy(
  () => import("./python/pages/ContinueAssignmentPage"),
);
const JupyterToolsPage = lazy(() => import("./python/pages/JupyterToolsPage"));

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <VerificationPopup />

      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-500">Loading...</div>
        }
      >
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
      </Suspense>
    </BrowserRouter>
  );
}
