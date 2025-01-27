import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "./ui/elements/sonner";
import { Home } from "./ui/screens/Home";
import { TooltipProvider } from "@/ui/elements/tooltip";
import { useEffect } from "react";
import { trackEvent } from "./services/analytics";

export default function App() {
  useEffect(() => {
    // Track app initialization
    trackEvent("App Initialized");
  }, []);

  return (
    <TooltipProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
        <Toaster position="bottom-right" />
      </Router>
    </TooltipProvider>
  );
}
