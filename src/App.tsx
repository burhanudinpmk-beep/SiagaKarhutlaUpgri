import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { GameProgressProvider } from './context/GameProgressContext';
import { LandingPage } from './pages/LandingPage';
import { MapPage } from './pages/MapPage';
import { BriefingPage } from './pages/BriefingPage';
import { SimulationPage } from './pages/SimulationPage';
import { ResultPage } from './pages/ResultPage';
import { StemEvaluationReportPage } from './pages/StemEvaluationReportPage';
import { CertificatePage } from './pages/CertificatePage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ErrorBoundary>
      <GameProgressProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/peta-kalbar" element={<MapPage />} />
              <Route path="/briefing/:regionId" element={<BriefingPage />} />
              <Route path="/briefing/:regionId/:missionId" element={<BriefingPage />} />
              <Route path="/simulasi/:regionId" element={<SimulationPage />} />
              <Route path="/simulasi/:regionId/:missionId" element={<SimulationPage />} />
              <Route path="/hasil" element={<StemEvaluationReportPage />} />
              <Route path="/evaluasi-stem" element={<StemEvaluationReportPage />} />
              <Route path="/hasil/:regionId" element={<ResultPage />} />
              <Route path="/hasil/:regionId/:missionId" element={<ResultPage />} />
              <Route path="/sertifikat" element={<CertificatePage />} />
              <Route path="/profil" element={<StudentProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </GameProgressProvider>
    </ErrorBoundary>
  );
}
