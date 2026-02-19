import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchProperties, triggerProcess } from '../services/api';
import { mockProperties } from '../data/mockData';
import { useEffect } from 'react';

const ResponseReceived = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const submission = location.state?.submission;

  const [properties, setProperties] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperties().then(setProperties).catch(() => setProperties(mockProperties));
  }, []);

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No submission data found.</p>
          <button
            onClick={() => navigate('/overview')}
            className="text-blue-600 hover:underline text-sm"
          >
            Return to Overview
          </button>
        </div>
      </div>
    );
  }

  const prioritizedProps = properties.filter((p) =>
    submission.prioritized_ids?.includes(p.submission_id)
  );
  const discardedProps = properties.filter((p) =>
    submission.discarded_ids?.includes(p.submission_id)
  );

  const handleActivate = async () => {
    setProcessing(true);
    setError('');
    try {
      await triggerProcess(submission.id);
      navigate('/processing', { state: { submissionId: submission.id } });
    } catch (err) {
      setError('Failed to start process. Please try again.');
      setProcessing(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
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
            <h1 className="text-2xl font-bold text-gray-900">Underwriter Response Received</h1>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Submitted at {formatTime(submission.created_at)}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Underwriter Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
              {submission.underwriter_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Underwriter</p>
              <p className="text-xl font-bold text-gray-900">{submission.underwriter_name}</p>
            </div>
          </div>
        </div>

        {/* Decision Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prioritized */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="font-semibold text-green-800">Prioritized ({prioritizedProps.length})</h3>
            </div>
            {prioritizedProps.length === 0 ? (
              <p className="text-green-600 text-sm">None selected</p>
            ) : (
              <div className="space-y-2">
                {prioritizedProps.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-green-200">
                    <img src={p.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                    <div>
                      <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded mr-1">{p.propertyId}</span>
                      <span className="text-sm font-medium text-gray-800">{p.property_county}</span>
                      <p className="text-xs text-gray-500">{p.occupancy_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discarded */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h3 className="font-semibold text-red-700">Discarded ({discardedProps.length})</h3>
            </div>
            {discardedProps.length === 0 ? (
              <p className="text-red-500 text-sm">None selected</p>
            ) : (
              <div className="space-y-2">
                {discardedProps.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-red-200">
                    <img src={p.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                    <div>
                      <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded mr-1">{p.propertyId}</span>
                      <span className="text-sm font-medium text-gray-800">{p.property_county}</span>
                      <p className="text-xs text-gray-500">{p.occupancy_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activate Button */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg mb-1">Ready to Run AI Analysis?</h3>
              <p className="text-gray-500 text-sm">
                Clicking <strong>Activate Risk Clearance</strong> will trigger the AI pipeline — running computer vision, geospatial analysis, and the quote propensity model across all 6 properties.
              </p>
            </div>
            <button
              onClick={handleActivate}
              disabled={processing}
              className={`flex-shrink-0 px-8 py-3.5 rounded-xl font-bold text-base transition-all duration-200 flex items-center gap-2 ${
                processing
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:-translate-y-0.5'
              }`}
            >
              {processing ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Initializing…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Activate Risk Clearance
                </>
              )}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

      </div>
    </div>
  );
};

export default ResponseReceived;
