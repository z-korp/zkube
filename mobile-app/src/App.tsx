import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const Home = lazy(() => import("./ui/screens/Home").then((m) => ({ default: m.Home })));
const PlayNew = lazy(() => import("./ui/screens/PlayNew").then((m) => ({ default: m.PlayNew })));

export default function App() {
  return (
    <Router>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="play/:gameId" element={<PlayNew />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
