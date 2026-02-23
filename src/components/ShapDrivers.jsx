import React from 'react';

const ShapDrivers = ({ drivers }) => {
  const maxContribution = Math.max(...drivers.map(d => Math.abs(d.contribution)), 0.001);

  return (
    <div className="bg-white rounded-lg shadow-card p-3">
      <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
        Key Drivers
      </h3>
      <p className="text-xs text-gray-500 mb-2">
        Top factors influencing AI risk assessment
      </p>

      <div className="space-y-1.5">
        {drivers.map((driver, index) => {
          const val = driver.contribution;
          const isNegative = val < 0;
          const absoluteValue = Math.abs(val);
          const percentage = (absoluteValue / maxContribution) * 100;

          return (
            <div key={index} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 truncate max-w-[130px]">{driver.feature.replace(/_/g, ' ')}</span>
                <span className={`font-semibold text-[11px] ml-1 flex-shrink-0 ${isNegative ? 'text-red-600' : 'text-blue-600'}`}>
                  {isNegative ? '' : '+'}{val.toFixed(2)}
                </span>
              </div>
              <div className="relative h-3 bg-gray-100 rounded overflow-hidden">
                <div
                  className={`h-full rounded ${isNegative ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShapDrivers;
