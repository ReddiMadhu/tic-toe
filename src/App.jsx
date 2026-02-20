import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PropertyOverview from './pages/PropertyOverview';
import UnderwriterDecision from './pages/UnderwriterDecision';
import ResponseReceived from './pages/ResponseReceived';
import PipelineAnimation from './pages/PipelineAnimation';
import DecisionComparison from './pages/DecisionComparison';
import PropertyDetail from './pages/PropertyDetail';
import Leaderboard from './pages/Leaderboard';
import TriagePage from './pages/TriagePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"                  element={<LandingPage />} />
        <Route path="/overview"          element={<PropertyOverview />} />
        <Route path="/decision"          element={<UnderwriterDecision />} />
        <Route path="/response-received" element={<ResponseReceived />} />
        <Route path="/processing"        element={<PipelineAnimation />} />
        <Route path="/comparison"        element={<DecisionComparison />} />
        <Route path="/property/:id"      element={<PropertyDetail />} />
        <Route path="/leaderboard"       element={<Leaderboard />} />
        <Route path="/triage"            element={<TriagePage />} />
      </Routes>
    </Router>
  );
}

export default App;
