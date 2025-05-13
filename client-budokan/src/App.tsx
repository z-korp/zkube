import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "./ui/elements/sonner";
import { Home } from "./ui/screens/Home";
import { TooltipProvider } from "@/ui/elements/tooltip";
import { Play } from "./ui/screens/Play";

export default function App() {
  return (
    <TooltipProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="play/:gameId" element={<Play />} />
        </Routes>
        <Toaster position="bottom-right" />
      </Router>
    </TooltipProvider>
  );
}
