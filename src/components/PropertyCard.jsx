import React from 'react';
import Badge from './Badge';

/**
 * PropertyCard component - displays property image and structured metadata
 *
 * @param {Object} props
 * @param {Object} props.property - Property data object
 * @param {Function} props.onClick - Click handler for card
 */
const PropertyCard = ({ property, onClick }) => {
  const {
    propertyId,
    imageUrl,
    submission_channel,
    occupancy_type,
    property_age,
    property_value,
    property_county,
    cover_type,
    building_coverage_limit,
    contents_coverage_limit,
    broker_company,
    income,
    property_past_loss_freq,
    property_past_claim_amount
  } = property;

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format currency in short form (e.g., $850K, $1.2M)
  const formatCurrencyShort = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer border border-gray-200 hover:border-gray-300"
    >
      {/* Property Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={`Property in ${property_county}`}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {/* Property ID Badge */}
        <div className="absolute top-2 left-2 bg-blue-600 text-white font-bold px-3 py-1 rounded-md shadow-md">
          {propertyId}
        </div>
      </div>

      {/* Metadata Section - 2 Column Grid */}
      <div className="p-2">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
          {/* LEFT COLUMN - 5 fields */}

          {/* Submission */}
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-gray-500 whitespace-nowrap">Submission:</span>
            <Badge variant="submission">{submission_channel}</Badge>
          </div>

          {/* Cover */}
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-gray-500 whitespace-nowrap">Cover:</span>
            <Badge variant="cover">{cover_type}</Badge>
          </div>

          {/* Occupancy */}
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-gray-500 whitespace-nowrap">Occupancy:</span>
            <span className="font-medium text-gray-800 truncate">{occupancy_type}</span>
          </div>

          {/* Building */}
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-gray-500 whitespace-nowrap">Building:</span>
            <span className="font-bold text-gray-900">{formatCurrencyShort(building_coverage_limit)}</span>
          </div>

          {/* Age */}
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-500 whitespace-nowrap">Age:</span>
            <span className="font-semibold text-gray-800">{property_age} yrs</span>
          </div>

          {/* Contents */}
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-gray-500 whitespace-nowrap">Contents:</span>
            <span className="font-bold text-gray-900">{formatCurrencyShort(contents_coverage_limit)}</span>
          </div>

          {/* Value */}
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-500 whitespace-nowrap">Value:</span>
            <span className="font-bold text-gray-900">{formatCurrency(property_value)}</span>
          </div>

          {/* Broker */}
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-500 whitespace-nowrap">Broker:</span>
            <span className="font-medium text-gray-700 truncate">{broker_company}</span>
          </div>

          {/* Income */}
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-500 whitespace-nowrap">Income:</span>
            <span className="font-bold text-gray-900">{formatCurrencyShort(income || 0)}</span>
          </div>

          {/* Loss Freq */}
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
            <span className="text-gray-500 whitespace-nowrap">Loss Freq:</span>
            <span className="font-semibold text-gray-800">{property_past_loss_freq || 0}</span>
          </div>

          {/* Claim Amt */}
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-500 whitespace-nowrap">Claim Amt:</span>
            <span className="font-bold text-gray-900">{formatCurrencyShort(property_past_claim_amount || 0)}</span>
          </div>

          {/* County */}
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-500 whitespace-nowrap">County:</span>
            <span className="font-semibold text-gray-800">{property_county}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
