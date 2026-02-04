import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "./ui/elements/sonner";
import { Home } from "./ui/screens/Home";
import { TooltipProvider } from "@/ui/elements/tooltip";
import { Play } from "./ui/screens/Play";
import { PlayFullscreen } from "./ui/screens/PlayFullscreen";

export default function App() {
  return (
    <TooltipProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Fullscreen UI is now the default */}
          <Route path="play/:gameId" element={<PlayFullscreen />} />
          {/* Legacy UI available for debugging/comparison */}
          <Route path="play-legacy/:gameId" element={<Play />} />
        </Routes>
        <Toaster position="bottom-right" />
      </Router>
    </TooltipProvider>
  );
}
