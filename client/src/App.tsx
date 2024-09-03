import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "./ui/elements/sonner";
import { Home } from "./ui/screens/Home";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/ui/elements/tooltip"; 


export default () => {
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
};
