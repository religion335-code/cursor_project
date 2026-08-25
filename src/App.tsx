import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AgentPage } from "./AgentPage";
import { HomePage } from "./HomePage";
import { OffersPage } from "./OffersPage";
import { RunwayPage } from "./RunwayPage";
import { Shell } from "./Shell";
import { StudioPage } from "./StudioPage";
import { StudioProvider } from "./studio-context";

export function App() {
  return (
    <StudioProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/runway" element={<RunwayPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/studio" element={<StudioPage />} />
            <Route path="/agent" element={<AgentPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StudioProvider>
  );
}
