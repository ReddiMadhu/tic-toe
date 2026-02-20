import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchProperties } from '../services/api';

// Propensity by position index (0=A=High, 1=B=High, 2=C=High, 3=D=Mid, 4=E=Mid, 5=F=Low)
const POSITION_PROPENSITY = [
  { label: 'High Propensity', tier: 'High', score: 0.8980 },
  { label: 'High Propensity', tier: 'High', score: 0.9307 },
  { label: 'High Propensity', tier: 'High', score: 0.8465 },
  { label: 'Mid Propensity',  tier: 'Mid',  score: 0.4319 },
  { label: 'Mid Propensity',  tier: 'Mid',  score: 0.4517 },
  { label: 'Low Propensity',  tier: 'Low',  score: 0.0357 },
];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

const TIER_LABEL = { high: 'High', mid: 'Mid', low: 'Low' };
const TIER_BADGE = {
  High: 'bg-green-100 text-green-700 border-green-300',
  Mid:  'bg-amber-100 text-amber-700 border-amber-200',
  Low:  'bg-red-100 text-red-700 border-red-200',
};
const TIER_SCORE_COLOR = {
  High: 'text-green-600',
  Mid:  'text-amber-600',
  Low:  'text-red-600',
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const TriagePage = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [propensityMap, setPropensityMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const propensityParam = (searchParams.get('propensity') || 'high').toLowerCase();
  const tierKey = TIER_LABEL[propensityParam] ?? 'High';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchProperties();
      // Build propensity map keyed by actual submission_id from API, using position index
      const map = {};
      data.forEach((p, i) => {
        if (POSITION_PROPENSITY[i]) map[p.submission_id] = POSITION_PROPENSITY[i];
      });
      setPropensityMap(map);
      setProperties(data);
      setLoading(false);
    };
    load();
  }, []);

  // Filter properties to only those matching the requested propensity tier
  const filteredProperties = properties.filter((p) => {
    const info = propensityMap[p.submission_id];
    return info?.tier === tierKey;
  });

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">UWT Triage</h1>
                <span className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${TIER_BADGE[tierKey]}`}>
                  {tierKey} Propensity
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Submissions assigned to the {tierKey} Propensity underwriting team
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading triage data...</p>
            </div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No {tierKey} propensity submissions found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200 border-b border-gray-300">
                  <tr>
                    <th className="px-3 pt-2 pb-2 text-left text-sm font-semibold text-gray-800">Property</th>
                    <th className="px-3 pt-2 pb-2 text-left text-sm font-semibold text-gray-800">Propensity Score</th>
                    <th className="px-3 pt-2 pb-2 text-left text-sm font-semibold text-gray-800">Cover Type</th>
                    <th className="px-3 pt-2 pb-2 text-left text-sm font-semibold text-gray-800">Building Coverage</th>
                    <th className="px-3 pt-2 pb-2 text-left text-sm font-semibold text-gray-800">Contents Coverage</th>
                    <th className="px-3 pt-2 pb-2 text-left text-sm font-semibold text-gray-800">State</th>
                    <th className="px-3 pt-2 pb-2 text-left text-sm font-semibold text-gray-800">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProperties.map((property) => {
                    const info = propensityMap[property.submission_id];
                    const scorePct = info ? Math.round(info.score * 100) : '—';
                    return (
                      <tr key={property.submission_id || property.id} className="hover:bg-gray-50 transition-colors">
                        {/* Property Column */}
                        <td className="px-3 py-2">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <img
                                src={property.imageUrl}
                                alt={property.property_county}
                                className="w-20 h-20 rounded-lg object-cover shadow-sm"
                              />
                              <div className="absolute -top-2 -left-2 bg-blue-600 text-white font-bold text-xs px-2 py-0.5 rounded shadow-md">
                                {property.propertyId}
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{property.property_county}</div>
                              <div className="text-sm text-gray-600">{property.occupancy_type}</div>
                              <div className="text-sm font-bold text-gray-900 mt-1">
                                {formatCurrency(property.property_value)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Propensity Score */}
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            <span className={`text-lg font-extrabold ${TIER_SCORE_COLOR[tierKey]}`}>
                              {scorePct}%
                            </span>
                            <span className={`text-xs font-medium border rounded-full px-2 py-0.5 w-fit ${TIER_BADGE[tierKey]}`}>
                              {info?.label ?? tierKey}
                            </span>
                          </div>
                        </td>

                        {/* Cover Type */}
                        <td className="px-3 py-2">
                          <span className="text-sm text-gray-700">{property.cover_type || '—'}</span>
                        </td>

                        {/* Building Coverage Limit */}
                        <td className="px-3 py-2">
                          <span className="text-sm font-medium text-gray-800">
                            {property.building_coverage_limit
                              ? formatCurrency(property.building_coverage_limit)
                              : <span className="text-gray-400">—</span>}
                          </span>
                        </td>

                        {/* Contents Coverage Limit */}
                        <td className="px-3 py-2">
                          <span className="text-sm font-medium text-gray-800">
                            {property.contents_coverage_limit
                              ? formatCurrency(property.contents_coverage_limit)
                              : <span className="text-gray-400">—</span>}
                          </span>
                        </td>

                        {/* State */}
                        <td className="px-3 py-2">
                          <span className="text-sm font-semibold text-gray-700">{property.state || '—'}</span>
                        </td>

                        {/* View Details */}
                        <td className="px-3 py-2">
                          <button
                            onClick={() =>
                              navigate(`/property/${property.submission_id || property.id}`, {
                                state: { property },
                              })
                            }
                            className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors inline-flex items-center gap-1.5"
                          >
                            View Details
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TriagePage;
