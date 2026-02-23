import React, { useState } from 'react';
import Badge from './Badge';

const ComparisonTable = ({ properties, decisions, onViewDetails }) => {
  const [exclusionModal, setExclusionModal] = useState(null); // { reason, parameters }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getDecision = (propertyId) => {
    return decisions.find(d => d.propertyId === propertyId);
  };

  const isMismatch = (userSelection, aiPrediction, excluded) => {
    if (excluded) return false;
    if (!userSelection || !aiPrediction) return false;
    const risk = (aiPrediction.risk || '').toLowerCase();
    if (userSelection === 'prioritized' && risk.includes('low')) return true;
    if (userSelection === 'discarded' && risk.includes('high')) return true;
    return false;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-200 border-b border-gray-300">
              <tr>
                <th className="px-3 pt-1 pb-2 text-left text-sm font-semibold text-gray-800">Property</th>
                <th className="px-3 pt-1 pb-2 text-left text-sm font-semibold text-gray-800">Your Selection</th>
                <th className="px-3 pt-1 pb-2 text-left text-sm font-semibold text-gray-800 w-36">AI Prediction</th>
                <th className="px-3 pt-1 pb-2 text-left text-sm font-semibold text-gray-800 w-48">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {properties.map((property) => {
                const decision = getDecision(property.propertyId);
                const userSelection = decision?.userSelection;
                const aiPrediction = decision?.aiPrediction;
                const excluded = decision?.excluded ?? false;
                const wrong = isMismatch(userSelection, aiPrediction, excluded);

                return (
                  <tr
                    key={property.submission_id || property.id}
                    className={`transition-colors ${excluded ? 'bg-gray-50 opacity-70' : 'hover:bg-gray-50'}`}
                  >
                    {/* Property Column */}
                    <td className="px-3 pt-1 pb-2">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img
                            src={property.imageUrl}
                            alt={property.property_county}
                            className={`w-20 h-20 rounded-lg object-cover shadow-sm ${excluded ? 'grayscale' : ''}`}
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

                    {/* Your Selection Column */}
                    <td className="px-3 pt-1 pb-2">
                      {userSelection === 'prioritized' ? (
                        <Badge variant="status" value="prioritized">Prioritized</Badge>
                      ) : userSelection === 'discarded' ? (
                        <Badge variant="status" value="discarded">Discarded</Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>

                    {/* AI Prediction Column */}
                    <td className="px-3 pt-1 pb-2">
                      {excluded ? (
                        <Badge variant="risk" value="Excluded">Excluded</Badge>
                      ) : aiPrediction ? (
                        <div>
                          <Badge variant="risk" value={aiPrediction.risk}>
                            {aiPrediction.risk}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Quote: <span className="font-semibold">{aiPrediction.quotePercentage}%</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>

                    {/* Action Column */}
                    <td className="px-3 pt-1 pb-2">
                      {excluded ? (
                        <button
                          onClick={() => setExclusionModal({
                            reason: decision.exclusionReason,
                            parameters: decision.exclusionParameters,
                          })}
                          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5 border border-orange-400 text-orange-600 hover:bg-orange-50"
                        >
                          Exclusion Info
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => onViewDetails(property, decision)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${wrong
                              ? 'border border-red-500 text-red-600 hover:bg-red-50'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                        >
                          View Details
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exclusion Modal */}
      {exclusionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setExclusionModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-gray-900">Property Excluded</h2>
              </div>
              <button
                onClick={() => setExclusionModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Reason */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Exclusion Reason</p>
              <p className="text-sm text-gray-700 leading-relaxed">{exclusionModal.reason || 'No reason provided.'}</p>
            </div>

            {/* Flagged Parameters — two sections */}
            {exclusionModal.parameters && exclusionModal.parameters.length > 0 && (() => {
              const contentParams = exclusionModal.parameters.filter(p =>
                /contents|coverage/i.test(p.label || p.name || '')
              );
              const incomeParams = exclusionModal.parameters.filter(p =>
                /income/i.test(p.label || p.name || '')
              );
              const otherParams = exclusionModal.parameters.filter(p =>
                !/contents|coverage|income/i.test(p.label || p.name || '')
              );

              const renderParam = (param, idx) => (
                <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 space-y-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-800">{param.label || param.name}</span>
                    <span className="text-sm font-bold text-orange-700 whitespace-nowrap flex-shrink-0">{param.value}</span>
                  </div>
                  {param.description && (
                    <p className="text-xs text-gray-500">{param.description}</p>
                  )}
                </div>
              );

              return (
                <div className="space-y-4">
                  {contentParams.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Contents Coverage
                      </p>
                      <div className="space-y-2">{contentParams.map(renderParam)}</div>
                    </div>
                  )}
                  {incomeParams.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Income
                      </p>
                      <div className="space-y-2">{incomeParams.map(renderParam)}</div>
                    </div>
                  )}
                  {otherParams.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Other Flagged Parameters</p>
                      <div className="space-y-2">{otherParams.map(renderParam)}</div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setExclusionModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ComparisonTable;

