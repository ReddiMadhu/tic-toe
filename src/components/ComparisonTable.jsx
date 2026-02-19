import React from 'react';
import Badge from './Badge';

const ComparisonTable = ({ properties, decisions, onViewDetails }) => {
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

  const isMismatch = (userSelection, aiPrediction) => {
    if (!userSelection || !aiPrediction) return false;
    const risk = (aiPrediction.risk || '').toLowerCase();
    if (userSelection === 'prioritized' && risk.includes('low')) return true;
    if (userSelection === 'discarded' && risk.includes('high')) return true;
    return false;
  };

  return (
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
              const wrong = isMismatch(userSelection, aiPrediction);

              return (
                <tr key={property.submission_id || property.id} className="hover:bg-gray-50 transition-colors">
                  {/* Property Column */}
                  <td className="px-3 pt-1 pb-2">
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
                    {aiPrediction ? (
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
                    <button
                      onClick={() => onViewDetails(property, decision)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
                        wrong
                          ? 'border border-red-500 text-red-600 hover:bg-red-50'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                      }`}
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
  );
};

export default ComparisonTable;

