import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ComparisonTable from '../components/ComparisonTable';
import ShapDrivers from '../components/ShapDrivers';
import { fetchProperties, fetchResults } from '../services/api';
import { mockResultsNew } from '../data/mockData';

const DecisionComparison = () => {
  const [properties, setProperties] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
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
      } catch (error) {
        console.error('Error loading data:', error);
        setResults(mockResultsNew);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [submissionId]);

  const handleViewDetails = (property, decision) => {
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
    const propertyLetter = property.propertyId;
    const propertyIndex = LETTERS.indexOf(propertyLetter);
    const propertyResult = results?.results?.[propertyIndex] ?? results?.results?.find(
      (r) => LETTERS[r.property_index] === propertyLetter
    );
    navigate(`/property/${property.submission_id || property.id}`, {
      state: { property, propertyResult, results },
    });
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-start gap-3">
          <button
            onClick={() => navigate('/')}
            title="Home"
            className="text-gray-400 hover:text-blue-600 transition-colors mt-1 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Underwriter vs AI – Decision Comparison
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {results?.underwriter_name
                ? `Reviewing ${results.underwriter_name}'s selections against AI risk predictions.`
                : 'Review how your selections compare with AI risk predictions.'}
            </p>
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
