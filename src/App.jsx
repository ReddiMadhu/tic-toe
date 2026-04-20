import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PropensityProvider } from './context/PropensityContext';
import LandingPage from './pages/LandingPage';
import PropertyOverview from './pages/PropertyOverview';
import UnderwriterDecision from './pages/UnderwriterDecision';
import ResponseReceived from './pages/ResponseReceived';
import PipelineAnimation from './pages/PipelineAnimation';
import DecisionComparison from './pages/DecisionComparison';
import PropertyDetail from './pages/PropertyDetail';
import Leaderboard from './pages/Leaderboard';
import TriagePage from './pages/TriagePage';
import PredictionLoadingPage from './pages/PredictionLoadingPage';
import PredictionResultsPage from './pages/PredictionResultsPage';

function App() {
  return (
    <PropensityProvider>
      <Router>
        <Routes>
          <Route path="/"                     element={<LandingPage />} />
          <Route path="/overview"             element={<PropertyOverview />} />
          <Route path="/decision"             element={<UnderwriterDecision />} />
          <Route path="/response-received"    element={<ResponseReceived />} />
          {/* Legacy route kept for backward compatibility */}
          <Route path="/processing"           element={<PipelineAnimation />} />
          <Route path="/comparison"           element={<DecisionComparison />} />
          {/* New two-pass prediction flow */}
          <Route path="/prediction-loading"   element={<PredictionLoadingPage />} />
          <Route path="/prediction-results"   element={<PredictionResultsPage />} />
          <Route path="/property/:id"         element={<PropertyDetail />} />
          <Route path="/leaderboard"          element={<Leaderboard />} />
          <Route path="/triage"               element={<TriagePage />} />
        </Routes>
      </Router>
    </PropensityProvider>
  );
}

export default App;
