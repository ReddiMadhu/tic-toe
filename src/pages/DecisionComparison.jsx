import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import ComparisonTable from '../components/ComparisonTable';
import ShapDrivers from '../components/ShapDrivers';
import { fetchProperties, fetchResults, sendTriageEmails } from '../services/api';
import { mockResultsNew } from '../data/mockData';

const DecisionComparison = () => {
  const [properties, setProperties] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scorePercent, setScorePercent] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageStatus, setTriageStatus] = useState(null); // null | 'sent' | 'error'
  const infoRef = useRef(null);
  const btnRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const submissionId = location.state?.submissionId;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [propertiesData, resultsData] = await Promise.all([
          fetchProperties(),
          fetchResults(submissionId || 1),
        ]);
        setProperties(propertiesData);
        setResults(resultsData);
        setScorePercent(resultsData?.score_percentage ?? 0);
      } catch (error) {
        console.error('Error loading data:', error);
        setResults(mockResultsNew);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [submissionId]);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!showInfo) return;
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        infoRef.current && !infoRef.current.contains(e.target)
      ) {
        setShowInfo(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showInfo]);

  const handleViewDetails = (property, decision) => {
    const propertyLetter = property.propertyId;
    const propertyIndex = LETTERS.indexOf(propertyLetter);
    const propertyResult = results?.results?.[propertyIndex] ?? results?.results?.find(
      (r) => LETTERS[r.property_index] === propertyLetter
    );
    navigate(`/property/${property.submission_id || property.id}`, {
      state: { property, propertyResult, results },
    });
  };

  const handleSmartAssign = async () => {
    setTriageLoading(true);
    setTriageStatus(null);
    try {
      await sendTriageEmails(submissionId);
      setTriageStatus('sent');
    } catch (err) {
      console.error('Smart Assign error:', err?.response?.data ?? err?.message ?? err);
      setTriageStatus('error');
    } finally {
      setTriageLoading(false);
      setTimeout(() => setTriageStatus(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  // Build decisions array keyed by propertyId letter (A–F) using property_index
  // This avoids submission_id format mismatches between properties and results APIs
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const decisions = (results?.results || []).map((r) => ({
    propertyId: LETTERS[r.property_index] ?? r.submission_id,
    userSelection: r.user_selection,
    aiPrediction: {
      risk: r.quote_propensity_label,
      quotePercentage: Math.round(r.quote_propensity * 100),
      propensityLabel: r.quote_propensity_label,
    },
    excluded: r.excluded ?? false,
    exclusionReason: r.exclusion_reason ?? null,
    exclusionParameters: r.exclusion_parameters ?? [],
  }));

  // Use global_shap from API if available, else aggregate
  const globalShap = results?.global_shap
    ? results.global_shap.map((s) => ({ feature: s.feature, contribution: s.mean_abs_shap }))
    : (() => {
        const allShap = (results?.results || []).flatMap((r) => r.shap_values || []);
        const shapMap = {};
        allShap.forEach(({ feature, mean_abs_shap, contribution }) => {
          if (!shapMap[feature]) shapMap[feature] = 0;
          shapMap[feature] += mean_abs_shap ?? Math.abs(contribution ?? 0);
        });
        return Object.entries(shapMap)
          .map(([feature, val]) => ({ feature, contribution: parseFloat((val / 6).toFixed(3)) }))
          .sort((a, b) => b.contribution - a.contribution)
          .slice(0, 8);
      })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              title="Home"
              className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Underwriter vs AI – Decision Comparison</h1>
          </div>

          {/* Score display + info icon + Leaderboard link */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-sm font-medium text-gray-500">Your Score</span>
                <span className="text-2xl font-extrabold text-gray-900">{scorePercent}%</span>
                {/* Info icon */}
                <div className="relative">
                  <button
                    ref={btnRef}
                    onClick={() => setShowInfo((v) => !v)}
                    className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors text-xs font-bold"
                    title="How is the score calculated?"
                  >
                    i
                  </button>
                  {showInfo && createPortal(
                    <div
                      ref={infoRef}
                      className="w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-left"
                      style={{
                        position: 'fixed',
                        zIndex: 9999,
                        top: btnRef.current ? btnRef.current.getBoundingClientRect().bottom + 8 : 60,
                        left: btnRef.current
                          ? Math.min(
                              btnRef.current.getBoundingClientRect().right - 288,
                              window.innerWidth - 296
                            )
                          : 'auto',
                      }}
                    >
                      <p className="text-xs font-bold text-gray-700 mb-2">How your score is calculated</p>
                      <p className="text-xs text-gray-500 mb-3">For each of the 6 properties:</p>
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="text-left pb-1 font-semibold">Your choice</th>
                            <th className="text-center pb-1 font-semibold">AI: High</th>
                            <th className="text-center pb-1 font-semibold">AI: Mid</th>
                            <th className="text-center pb-1 font-semibold">AI: Low</th>
                            <th className="text-center pb-1 font-semibold">Excluded</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr>
                            <td className="py-1 text-green-700 font-medium">Prioritized</td>
                            <td className="text-center py-1 font-bold text-green-600">+1</td>
                            <td className="text-center py-1 font-bold text-amber-600">+0.5</td>
                            <td className="text-center py-1 text-gray-400">0</td>
                            <td className="text-center py-1 text-gray-400">0</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-red-600 font-medium">Discarded</td>
                            <td className="text-center py-1 text-gray-400">0</td>
                            <td className="text-center py-1 font-bold text-amber-600">+0.5</td>
                            <td className="text-center py-1 font-bold text-green-600">+1</td>
                            <td className="text-center py-1 font-bold text-green-600">+1</td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-xs text-gray-400 mt-3">Max score = 6 points → shown as %</p>
                    </div>,
                    document.body
                  )}
                </div>
              </div>
              <div className="w-40 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-gray-800"
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => navigate('/leaderboard')}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Leaderboard
            </button>
            <div className="relative">
              <button
                onClick={handleSmartAssign}
                disabled={triageLoading}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {triageLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                Smart Assign to UWT
              </button>
              {triageStatus === 'sent' && (
                <div className="absolute top-full right-0 mt-1.5 w-52 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg px-3 py-2 shadow-md z-50 whitespace-nowrap">
                  Emails sent to all UWT teams
                </div>
              )}
              {triageStatus === 'error' && (
                <div className="absolute top-full right-0 mt-1.5 w-52 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg px-3 py-2 shadow-md z-50">
                  Failed to send — check SMTP config
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 70/30 Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* LEFT SIDE - 70% - Comparison Table */}
          <div className="lg:w-[70%]">
            <ComparisonTable
              properties={properties}
              decisions={decisions}
              onViewDetails={handleViewDetails}
            />
          </div>

          {/* RIGHT SIDE - 30% - SHAP Drivers */}
          <div className="lg:w-[30%]">
            <ShapDrivers drivers={globalShap} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecisionComparison;
