import { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { Loading } from "@/ui/screens/Loading";
import "./pixi/extend";
import "./index.css";
import { validateEnv } from "./config/env";
const AppRuntime = lazy(() => import("./AppRuntime"));

validateEnv();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <Suspense fallback={<Loading />}>
    <AppRuntime />
  </Suspense>
);
