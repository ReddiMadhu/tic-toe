import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProperties, submitDecision } from '../services/api';

const CONSTRUCTION_RISK_COLORS = {
  Low:    'bg-green-100 text-green-700 border-green-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  High:   'bg-red-100 text-red-700 border-red-200',
};

const UnderwriterDecision = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prioritized, setPrioritized] = useState(new Set());
  const [discarded, setDiscarded] = useState(new Set());
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperties().then((data) => {
      setProperties(data);
      setLoading(false);
    });
  }, []);

  const handlePrioritize = (id) => {
    setPrioritized((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setError('');
  };

  const handleDiscard = (id) => {
    setDiscarded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setError('');
  };

  // IDs that are in both sets (overlap conflict)
  const overlap = [...prioritized].filter((id) => discarded.has(id));

  const canSubmit =
    prioritized.size >= 1 &&
    discarded.size >= 1 &&
    name.trim().length > 0 &&
    overlap.length === 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await submitDecision({
        underwriter_name: name.trim(),
        prioritized_ids: [...prioritized],
        discarded_ids: [...discarded],
      });
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrencyShort = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  // Success overlay
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Decision Submitted Successfully</h2>
          <p className="text-gray-500 mb-6">Comparing your underwriting strategy with AI…</p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
            {/* <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div> */}
            <span>The presenter will initiate the AI comparison shortly.</span>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Underwriter Decision Panel</h1>
            <p className="mt-1 text-sm text-gray-500">
              As an underwriter, review the six properties below and make your strategic decision.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Instruction Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-900 font-medium text-sm">
            As an underwriter, which properties would you <strong>prioritize for approval</strong> and which would you <strong>discard</strong> based on risk profile?
          </p>
          <p className="text-blue-700 text-xs mt-1">
            You must select at least one property in each category. The same property cannot be both prioritized and discarded.
          </p>
        </div>

        {/* 2x3 Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {properties.map((property) => {
            const isPrioritized = prioritized.has(property.id);
            const isDiscarded = discarded.has(property.id);
            const hasOverlap = isPrioritized && isDiscarded;

            return (
              <div
                key={property.id}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-200 ${
                  hasOverlap
                    ? 'border-red-400 shadow-red-100'
                    : isPrioritized
                    ? 'border-green-400 shadow-green-50'
                    : isDiscarded
                    ? 'border-red-300 shadow-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Property Image */}
                <div className="relative h-40 overflow-hidden bg-gray-100">
                  <img
                    src={property.imageUrl}
                    alt={`Property ${property.propertyId}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow">
                    {property.propertyId}
                  </div>
                  {hasOverlap && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs text-center py-1 font-medium">
                      Cannot be both prioritized and discarded
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="p-3">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                      {property.state}
                    </span>
                    <span className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5">
                      {property.occupancy_type}
                    </span>
                    <span className={`text-xs rounded px-2 py-0.5 border font-medium ${CONSTRUCTION_RISK_COLORS[property.construction_risk]}`}>
                      {property.construction_risk} Risk
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    <span className="font-semibold text-gray-800">{property.property_county}</span>
                    {' · '}
                    {formatCurrencyShort(property.property_value)}
                    {' · '}
                    {property.property_age} yrs
                  </div>

                  {/* Decision Controls */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    {/* Prioritize */}
                    <label className={`flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 transition-colors ${
                      isPrioritized ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isPrioritized}
                        onChange={() => handlePrioritize(property.id)}
                        className="w-4 h-4 accent-green-600 cursor-pointer"
                      />
                      <span className={`text-sm font-medium ${isPrioritized ? 'text-green-700' : 'text-gray-600'}`}>
                        Prioritize this property
                      </span>
                      {isPrioritized && (
                        <span className="ml-auto text-green-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </label>

                    {/* Discard */}
                    <label className={`flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 transition-colors ${
                      isDiscarded ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isDiscarded}
                        onChange={() => handleDiscard(property.id)}
                        className="w-4 h-4 accent-red-500 cursor-pointer"
                      />
                      <span className={`text-sm font-medium ${isDiscarded ? 'text-red-600' : 'text-gray-600'}`}>
                        Discard this property
                      </span>
                      {isDiscarded && (
                        <span className="ml-auto text-red-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selection Summary */}
        {(prioritized.size > 0 || discarded.size > 0) && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-4">
            {prioritized.size > 0 && (
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prioritized</span>
                <div className="flex gap-1.5 mt-1">
                  {[...prioritized].map((id) => {
                    const p = properties.find((x) => x.id === id);
                    return (
                      <span key={id} className="bg-green-100 text-green-700 font-bold text-xs px-2 py-0.5 rounded">
                        {p?.propertyId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {discarded.size > 0 && (
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Discarded</span>
                <div className="flex gap-1.5 mt-1">
                  {[...discarded].map((id) => {
                    const p = properties.find((x) => x.id === id);
                    return (
                      <span key={id} className="bg-red-100 text-red-600 font-bold text-xs px-2 py-0.5 rounded">
                        {p?.propertyId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Name + Submit */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow mb-4"
          />

          {error && (
            <div className="text-red-600 text-sm mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {overlap.length > 0 && (
            <div className="text-red-600 text-sm mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              A property cannot be both prioritized and discarded. Please resolve the conflict.
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${
              canSubmit && !submitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Submitting…
              </span>
            ) : (
              'Submit Decision'
            )}
          </button>

          {!canSubmit && !submitting && (
            <p className="text-xs text-gray-400 text-center mt-2">
              {prioritized.size === 0 && 'Select at least one property to prioritize. '}
              {discarded.size === 0 && 'Select at least one property to discard. '}
              {name.trim().length === 0 && 'Enter your name.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnderwriterDecision;
