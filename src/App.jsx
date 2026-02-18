import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PropertyOverview from './pages/PropertyOverview';
import DecisionComparison from './pages/DecisionComparison';

/**
 * Main App component with routing configuration
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PropertyOverview />} />
        <Route path="/comparison" element={<DecisionComparison />} />
      </Routes>
    </Router>
  );
}

export default App;
