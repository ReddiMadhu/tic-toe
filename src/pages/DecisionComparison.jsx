import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ComparisonTable from '../components/ComparisonTable';
import ShapDrivers from '../components/ShapDrivers';
import { fetchProperties, fetchDecisions, fetchShapDrivers } from '../services/api';

/**
 * DecisionComparison page - displays underwriter vs AI decision comparison
 * with 70/30 layout (table on left, SHAP drivers on right)
 */
const DecisionComparison = () => {
  const [properties, setProperties] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [shapDrivers, setShapDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [propertiesData, decisionsData, shapData] = await Promise.all([
          fetchProperties(),
          fetchDecisions(),
          fetchShapDrivers()
        ]);
        setProperties(propertiesData);
        setDecisions(decisionsData);
        setShapDrivers(shapData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleViewDetails = (propertyId) => {
    console.log('View details for property:', propertyId);
    // Future enhancement: navigate to detailed property page
    alert(`Property details view coming soon for Property ID: ${propertyId}`);
  };

  const handleBackToOverview = () => {
    navigate('/');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* <button
            onClick={handleBackToOverview}
            className="mb-2 text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Overview
          </button> */}
          <h1 className="text-2xl font-bold text-gray-900">
            Underwriter vs AI – Decision Comparison
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Review how your selections compare with AI risk predictions.
          </p>
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
            <ShapDrivers drivers={shapDrivers} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecisionComparison;
