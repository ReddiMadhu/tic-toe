import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UnderwriterDecision from './pages/UnderwriterDecision';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<UnderwriterDecision />} />
                <Route path="/decision" element={<UnderwriterDecision />} />
            </Routes>
        </Router>
    );
}

export default App;
