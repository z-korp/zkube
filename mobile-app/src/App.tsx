import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Loading } from "@/ui/screens/Loading";

const Home = lazy(() => import("./ui/screens/Home").then((m) => ({ default: m.Home })));
const PlayNew = lazy(() => import("./ui/screens/PlayNew").then((m) => ({ default: m.PlayNew })));

export default function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="play/:gameId" element={<PlayNew />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
