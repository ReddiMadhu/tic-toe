import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { mockProperties, mockResults } from '../data/mockData';

const RISK_COLORS = {
  High:   { bg: 'bg-red-100',   text: 'text-red-700',   border: 'border-red-300'   },
  Medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  Low:    { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
};

const CONDITION_COLORS = {
  Excellent: 'text-green-600',
  Good:      'text-green-500',
  Fair:      'text-amber-500',
  Poor:      'text-red-500',
  Critical:  'text-red-700 font-bold',
};

const FINDING_RISK_COLORS = {
  Low:    'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  High:   'bg-red-100 text-red-700',
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const formatCurrencyShort = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

// Section header bar — light theme, no number badge
const SectionBar = ({ title, right }) => (
  <div className="flex items-center justify-between bg-gray-100 border-b border-gray-200 px-4 py-2.5">
    <span className="text-sm font-semibold text-gray-800">{title}</span>
    {right && <div>{right}</div>}
  </div>
);

// Vulnerability Popup — compact list style matching screenshot
const VulnerabilityPopup = ({ data, onClose }) => {
  if (!data) return null;
  const { roof_detection, proximity, object_detection } = data;

  const wildfireEntries = Object.entries(proximity || {}).filter(([k]) =>
    k.toLowerCase().includes('wildfire') || k.toLowerCase().includes('fire')
  );
  const hurricaneEntries = Object.entries(proximity || {}).filter(([k]) =>
    k.toLowerCase().includes('hurricane') || k.toLowerCase().includes('storm') ||
    k.toLowerCase().includes('wind') || k.toLowerCase().includes('flood')
  );
  // fallback: split evenly if no keyword match
  const allProx = Object.entries(proximity || {});
  const wfList = wildfireEntries.length ? wildfireEntries : allProx.slice(0, Math.ceil(allProx.length / 2));
  const hList  = hurricaneEntries.length ? hurricaneEntries : allProx.slice(Math.ceil(allProx.length / 2));

  const detectionSummary = object_detection?.findings
    ?.map(f => f.label)
    .join(', ') || '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-80 max-h-[80vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="text-sm font-bold text-gray-900">Property Vulnerability Risk</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List items */}
        <div className="divide-y divide-gray-100">
          {/* Roof detection */}
          {roof_detection && (
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">Roof detection results</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Roof Condition: {roof_detection.condition}, {roof_detection.material}
                  {roof_detection.damage_areas?.length > 0 && ` · Damage: ${roof_detection.damage_areas.join(', ')}`}
                </p>
              </div>
            </div>
          )}

          {/* Wildfire */}
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">Proximity to wildfire zone</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {wfList.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ') || '—'}
              </p>
            </div>
          </div>

          {/* Hurricane */}
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">Hurricane exposure</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {hList.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ') || '—'}
              </p>
            </div>
          </div>

          {/* Object detection */}
          {object_detection && (
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">Object detection findings</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Object Detection: {detectionSummary}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showVulnerabilityPopup, setShowVulnerabilityPopup] = useState(false);

  const propertyId = parseInt(id, 10);
  const results = location.state?.results || mockResults;
  const propertyResult = results?.results?.find((r) => r.property_id === propertyId);
  const property = mockProperties.find((p) => p.id === propertyId);

  if (!property || !propertyResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Property not found.</p>
          <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline text-sm">Go Back</button>
        </div>
      </div>
    );
  }

  const { ai_risk, quote_propensity, total_risk_score, shap_values = [], vulnerability_data = {}, user_selection } = propertyResult;
  const riskColor = RISK_COLORS[ai_risk] || RISK_COLORS.Medium;

  const riskBreakdown = [
    { label: 'Property Vulnerability Risk', score: total_risk_score, hasView: true },
    { label: 'Property Condition Risk',     score: parseFloat((total_risk_score + 0.03).toFixed(2)) },
    { label: 'Locality Risk',               score: parseFloat((total_risk_score - 0.18).toFixed(2)) },
    { label: 'Claim History Risk',          score: parseFloat((total_risk_score - 0.26).toFixed(2)) },
    { label: 'Coverage Risk',               score: parseFloat((total_risk_score - 0.13).toFixed(2)) },
  ];

  const maxShap = Math.max(...shap_values.map((s) => Math.abs(s.contribution)));
  // Sort: positive contributions first, negative last
  const sortedShap = [...shap_values].sort((a, b) => b.contribution - a.contribution);

  const selectionIcon = user_selection === 'prioritized' ? '🟢' : user_selection === 'discarded' ? '🔴' : '⚪';
  const selectionLabel = user_selection === 'prioritized' ? 'Prioritized' : user_selection === 'discarded' ? 'Discarded' : 'Not Selected';
  const selectionCls = user_selection === 'prioritized'
    ? 'bg-green-50 text-green-700 border-green-300'
    : user_selection === 'discarded'
    ? 'bg-red-50 text-red-600 border-red-300'
    : 'bg-gray-100 text-gray-500 border-gray-300';

  // Property params for table (2 rows)
  const paramRow1 = [
    { label: 'Submission', value: property.submission_channel },
    { label: 'Broker',     value: property.broker_company },
    { label: 'Occupancy',  value: property.occupancy_type },
    { label: 'Owner',      value: property.occupancy_type === 'Owner-Occupied' ? 'Yes' : 'No' },
    { label: 'County',     value: property.property_county },
    { label: 'Age',        value: `${property.property_age} yrs` },
    { label: 'Value',      value: formatCurrency(property.property_value) },
  ];
  const paramRow2 = [
    { label: 'County',    value: property.property_county },
    { label: 'Cover',     value: property.cover_type },
    { label: 'Building',  value: formatCurrencyShort(property.building_coverage_limit) },
    { label: 'Contents',  value: formatCurrencyShort(property.contents_coverage_limit) },
    { label: 'Broker',    value: property.broker_company },
  ];

  const riskEmoji = ai_risk === 'High' ? '🔴' : ai_risk === 'Medium' ? '🟠' : '🟢';

  return (
    <div className="min-h-screen bg-gray-50">
      {showVulnerabilityPopup && (
        <VulnerabilityPopup
          data={vulnerability_data}
          onClose={() => setShowVulnerabilityPopup(false)}
        />
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            title="Home"
            className="text-gray-400 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-lg font-bold text-gray-900">Property Risk Evaluation Page</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-3">

        {/* ── 1. Submission Overview ── */}
        <div className="rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm">
          <SectionBar title="Submission Overview" />
          <div className="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="text-gray-600">
              Submission ID: <span className="font-semibold text-gray-900">SUB-{String(propertyId).padStart(5, '0')}</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">
              Score: <span className={`font-semibold ${riskColor.text}`}>{total_risk_score.toFixed(2)}</span>
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 flex items-center gap-1">
              Category: <span className={`font-semibold ml-1 ${riskColor.text}`}>{riskEmoji} {ai_risk} Risk</span>
            </span>
            <div className="ml-auto">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${selectionCls}`}>
                {selectionIcon} Your Selection: {selectionLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. Images Section ── */}
        <div className="rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm">
          <SectionBar title="Images Section (Property + Roof)" />
          <div className="p-3 grid grid-cols-2 gap-3 bg-gray-200">
            <div className="relative">
              <img
                src={property.imageUrl}
                alt="Property front"
                className="w-full h-48 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1.5">
                Front Property Image
              </div>
            </div>
            <div className="relative">
              <img
                src={property.roofImageUrl}
                alt="Roof"
                className="w-full h-48 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1.5">
                Roof Image
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Property Parameter Values ── */}
        <div className="rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm">
          <SectionBar title="Property Parameter Values" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  {paramRow1.map(({ label, value }) => (
                    <td key={label} className="px-3 py-2.5 border-r border-gray-200 last:border-r-0 whitespace-nowrap">
                      <p className="text-gray-400 text-[10px] uppercase tracking-wide">{label}</p>
                      <p className="font-semibold text-gray-800 text-xs mt-0.5">{value}</p>
                    </td>
                  ))}
                </tr>
                <tr>
                  {paramRow2.map(({ label, value }) => (
                    <td key={label} className="px-3 py-2.5 border-r border-gray-200 last:border-r-0 whitespace-nowrap">
                      <p className="text-gray-400 text-[10px] uppercase tracking-wide">{label}</p>
                      <p className="font-semibold text-gray-800 text-xs mt-0.5">{value}</p>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 4 & 5 side by side ── */}
        <div className="grid grid-cols-2 gap-3">

          {/* ── 4. Key Driver Analysis (SHAP) ── */}
          <div className="rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm flex flex-col">
            <SectionBar title="Key Driver Analysis (Local SHAP Values)" />
            <div className="p-4 flex-1">
              <p className="text-xs font-semibold text-gray-700 mb-3">What Influenced the AI Prediction</p>
              <div className="space-y-1.5">
                {sortedShap.map((shap, i) => {
                  const abs = Math.abs(shap.contribution);
                  const pct = maxShap > 0 ? (abs / maxShap) * 100 : 0;
                  const isNegative = shap.contribution < 0;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 w-44 truncate text-right flex-shrink-0">
                        {shap.feature.replace(/_/g, '_')} ({abs.toFixed(3)})
                      </span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-sm overflow-hidden">
                        <div
                          className={`h-full rounded-sm transition-all duration-500 ${
                            isNegative
                              ? 'bg-red-400'
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-1">
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <div className="w-6 h-2.5 rounded-sm bg-red-400 flex-shrink-0"></div>
                  <span>Red → Reduced Risk (Negative Contribution)</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <div className="w-6 h-2.5 rounded-sm bg-green-600 flex-shrink-0"></div>
                  <span>Dark Green → Increased Risk (Positive Contribution)</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5. Property Risk Breakdown ── */}
          <div className="rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm flex flex-col">
            <SectionBar
              title="Property Risk Breakdown (Structured Risks)"
              right={
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-red-400">🟥</span>
                  <span className="text-xs text-red-400">🟥</span>
                </div>
              }
            />
            <div className="p-4 flex-1">
              <p className="text-sm font-bold text-gray-800 mb-3">
                Total Risk Score: <span className={riskColor.text}>{total_risk_score.toFixed(2)}</span>
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-[10px] text-gray-400 font-medium pb-1.5 uppercase tracking-wide">Risk Factor</th>
                    <th className="text-left text-[10px] text-gray-400 font-medium pb-1.5 uppercase tracking-wide w-14">Score</th>
                    <th className="text-right text-[10px] text-gray-400 font-medium pb-1.5 uppercase tracking-wide w-14">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {riskBreakdown.map(({ label, score, hasView }) => (
                    <tr key={label} className="hover:bg-gray-50">
                      <td className="py-2 text-gray-700 font-medium">{label}</td>
                      <td className="py-2 font-mono font-semibold text-gray-800">{score.toFixed(2)}</td>
                      <td className="py-2 text-right">
                        {hasView ? (
                          <button
                            onClick={() => setShowVulnerabilityPopup(true)}
                            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors shadow-sm"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Quote Propensity inline at bottom */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">AI Quote Propensity</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-blue-600">{Math.round(quote_propensity * 100)}%</span>
                  <div className="flex-1">
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                        style={{ width: `${Math.round(quote_propensity * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${riskColor.bg} ${riskColor.text} ${riskColor.border}`}>
                    {ai_risk}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PropertyDetail;
