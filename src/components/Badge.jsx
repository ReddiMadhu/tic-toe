import React from 'react';

/**
 * Badge component for displaying status indicators, risk levels, and metadata tags
 *
 * @param {Object} props
 * @param {'submission' | 'occupancy' | 'cover' | 'broker' | 'status' | 'risk'} props.variant - Badge style variant
 * @param {string} props.children - Badge content
 * @param {string} props.value - Optional value for status badges (prioritized/discarded) or risk badges (High/Medium/Low)
 */
const Badge = ({ variant = 'default', children, value }) => {
  // Base classes for all badges
  const baseClasses = 'inline-flex items-center rounded-full text-xs font-medium';

  // Variant-specific styling
  const variantClasses = {
    submission: 'bg-purple-100 text-purple-700 border border-purple-300 text-xs px-1.5 py-0.5',
    occupancy: 'bg-gray-100 text-gray-700 border border-gray-300 px-2 py-0.5',
    cover: 'bg-blue-100 text-blue-700 border border-blue-300 px-1.5 py-0.5',
    broker: 'bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5',
    status: value === 'prioritized'
      ? 'bg-green-500 text-white px-2 py-0.5'
      : value === 'discarded'
      ? 'bg-red-500 text-white px-2 py-0.5'
      : 'bg-gray-200 text-gray-500 px-2 py-0.5',
    risk: (value === 'High' || value?.includes('High'))
      ? 'bg-green-100 text-green-700 border border-green-300 px-2 py-0.5'
      : (value === 'Medium' || value?.includes('Mid'))
      ? 'bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5'
      : (value === 'Low' || value?.includes('Low'))
      ? 'bg-red-100 text-red-700 border border-red-300 px-2 py-0.5'
      : (value === 'Excluded' || value?.includes('Excluded'))
      ? 'bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5'
      : 'bg-gray-100 text-gray-700 border border-gray-300 px-2 py-0.5',
    default: 'bg-gray-100 text-gray-700 border border-gray-300 px-2 py-0.5'
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant] || variantClasses.default}`}>
      {children}
    </span>
  );
};

export default Badge;
