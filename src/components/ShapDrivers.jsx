import React from 'react';

/**
 * ShapDrivers component - displays SHAP driver explanations with horizontal bar chart
 *
 * @param {Object} props
 * @param {Array} props.drivers - Array of SHAP driver objects with feature and contribution
 */
const ShapDrivers = ({ drivers }) => {
  // Find the maximum absolute contribution for scaling
  const maxContribution = Math.max(...drivers.map(d => Math.abs(d.contribution)));

  return (
    <div className="bg-white rounded-lg shadow-card p-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Key Drivers
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        Top factors influencing AI risk assessment
      </p>

      <div className="space-y-2">
        {drivers.map((driver, index) => {
          // Always use absolute value
          const absoluteValue = Math.abs(driver.contribution);
          const percentage = (absoluteValue / maxContribution) * 100;

          return (
            <div key={index} className="space-y-1">
              {/* Feature name and contribution value */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">{driver.feature}</span>
                <span className="font-semibold text-blue-600">
                  +{absoluteValue.toFixed(2)}
                </span>
              </div>

              {/* Horizontal bar - always blue gradient for positive values */}
              <div className="relative h-8 bg-gray-100 rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md bg-gradient-to-r from-blue-400 to-blue-600"
                  style={{ width: `${percentage}%` }}
                >
                  <div className="h-full flex items-center justify-end pr-3">
                    <span className="text-xs font-medium text-white">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShapDrivers;
