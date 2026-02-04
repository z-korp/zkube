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
          <Route path="play/:gameId" element={<Play />} />
          <Route path="play-fullscreen/:gameId" element={<PlayFullscreen />} />
        </Routes>
        <Toaster position="bottom-right" />
      </Router>
    </TooltipProvider>
  );
}
