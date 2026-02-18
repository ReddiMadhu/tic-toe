import { useState, useEffect, useRef } from 'react';
import PropertyCard from '../components/PropertyCard';
import { fetchProperties, pollSubmission } from '../services/api';
import { useNavigate } from 'react-router-dom';

const POLL_INTERVAL_MS = 3000;

const PropertyOverview = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  // Track the submission id at mount time so we detect NEW submissions
  const initialIdRef = useRef(null);
  const alreadyNavigatedRef = useRef(false);

  useEffect(() => {
    fetchProperties().then((data) => {
      setProperties(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    // Capture the current latest submission id so we don't react to old ones
    pollSubmission().then((result) => {
      initialIdRef.current = result?.id ?? null;
    });

    intervalRef.current = setInterval(async () => {
      const result = await pollSubmission();
      if (
        result &&
        result.id !== initialIdRef.current &&
        !alreadyNavigatedRef.current
      ) {
        alreadyNavigatedRef.current = true;
        clearInterval(intervalRef.current);
        navigate('/response-received', { state: { submission: result } });
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [navigate]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              title="Home"
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Property Submission Overview</h1>
          </div>
          {/* Polling status */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            Waiting for underwriter response…
          </div>
        </div>
      </div>

      {/* Polling Banner */}
      <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium">
        Live session active · Polling every 3s · Share the QR code on the landing page with your underwriter
      </div>

      {/* Main Content - 2x3 Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onClick={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PropertyOverview;
