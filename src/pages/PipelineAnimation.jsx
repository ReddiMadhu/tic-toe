import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mockProperties, mockResults } from '../data/mockData';

// ─── Per-property stream data (from mockData) ───────────────────────────────
const PROPERTIES_STREAM = mockResults.results.map((r, i) => {
  const prop = mockProperties.find((p) => p.id === r.property_id) || mockProperties[i];
  const findings = (r.vulnerability_data?.object_detection?.findings || [])
    .map((f) => `${f.label} · ${f.risk}`)
    .join('  ·  ') || 'No findings';
  const wildfire = r.vulnerability_data?.proximity?.wildfire_zone || '—';
  const flood    = r.vulnerability_data?.proximity?.flood_zone    || '—';
  const propPct  = Math.round(r.quote_propensity * 100);
  const category = propPct >= 70 ? 'HIGH' : propPct >= 40 ? 'MEDIUM' : 'LOW';
  return {
    id: prop.propertyId,
    imageUrl: prop.imageUrl,
    county: prop.property_county,
    occupancy: prop.occupancy_type,
    age: prop.property_age,
    roofCondition: r.vulnerability_data?.roof_detection?.condition || '—',
    roofMaterial:  r.vulnerability_data?.roof_detection?.material  || '—',
    wildfire,
    flood,
    findings,
    riskScore: r.total_risk_score,
    aiRisk: r.ai_risk,
    propensity: r.quote_propensity,
    propensityPct: `${propPct}%`,
    propensityCategory: category,
  };
});

// ─── Phase 1 — Property Insights (5 steps) ───────────────────────────────────
const PHASE1_STEPS = [
  {
    id: 'p1s1',
    label: 'Fetching Roof Images',
    getInput:  (p) => `Satellite dataset · ${p.county}`,
    getOutput: (p) => `Roof image retrieved · ${p.roofMaterial}`,
  },
  {
    id: 'p1s2',
    label: 'Image Processing',
    getInput:  ()  => `Raw satellite image · resolution normalisation`,
    getOutput: (p) => `Image pre-processed · Roof condition: ${p.roofCondition}`,
  },
  {
    id: 'p1s3',
    label: 'Running Computer Vision Model (YOLOv8)',
    getInput:  ()  => `Processed roof image · YOLOv8-property-v2`,
    getOutput: (p) => p.findings,
  },
  {
    id: 'p1s4',
    label: 'Running Proximity Analysis',
    getInput:  (p) => `GPS coords · ${p.county} hazard zone maps`,
    getOutput: (p) => `Wildfire: ${p.wildfire}  ·  Flood: ${p.flood}`,
  },
  {
    id: 'p1s5',
    label: 'Calculating Property Risk Score',
    getInput:  ()  => `CV findings + proximity zones + roof condition`,
    getOutput: (p) => `Risk Score: ${p.riskScore}  ·  ${p.aiRisk} Risk`,
  },
];

// ─── Phase 2 — Quote Propensity (6 steps) ────────────────────────────────────
const PHASE2_STEPS = [
  {
    id: 'p2s1',
    label: 'Fetching External & Internal Data',
    getInput:  ()  => `Policy DB · external hazard API · claims history`,
    getOutput: (p) => `Data fetched · ${p.occupancy} · Age: ${p.age} yrs`,
  },
  {
    id: 'p2s2',
    label: 'Data Cleaning & Transformation',
    getInput:  ()  => `Raw fields · missing-value imputation`,
    getOutput: ()  => `Dataset cleaned · 28 features ready`,
  },
  {
    id: 'p2s3',
    label: 'Feature Engineering',
    getInput:  (p) => `Risk score: ${p.riskScore} · hazard exposure values`,
    getOutput: ()  => `Hurricane exposure encoded · Wildfire index computed`,
  },
  {
    id: 'p2s4',
    label: 'Preprocessing & Standardisation',
    getInput:  ()  => `28 engineered features · scaler pipeline`,
    getOutput: ()  => `Features normalised · model-ready tensor`,
  },
  {
    id: 'p2s5',
    label: 'Running Propensity Prediction Model',
    getInput:  ()  => `Preprocessed tensor · XGBoost propensity model`,
    getOutput: (p) => `Raw output: ${p.propensity.toFixed(2)}  ·  Calibrated`,
  },
  {
    id: 'p2s6',
    label: 'Computing SHAP Explanation Values',
    getInput:  ()  => `Model + input features · TreeExplainer`,
    getOutput: (p) => `${p.propensityPct} Quote Propensity  ·  ${p.propensityCategory}  ·  SHAP values ready`,
  },
];

const STEP_DURATION_MS = 620;

// ─── Risk color helpers ───────────────────────────────────────────────────────
const riskBadge = (risk) => {
  if (risk === 'High')   return 'bg-red-100 text-red-700 border-red-200';
  if (risk === 'Medium') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-green-100 text-green-700 border-green-200';
};
const propBadge = (cat) => {
  if (cat === 'HIGH')   return 'bg-green-100 text-green-700 border-green-200';
  if (cat === 'MEDIUM') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

// ─── Component ────────────────────────────────────────────────────────────────
const PipelineAnimation = () => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const submissionId = location.state?.submissionId;
  const logRef      = useRef(null);

  const [phase, setPhase]           = useState(1);
  const [progress, setProgress]     = useState(0);
  const [done, setDone]             = useState(false);
  const [currentDetail, setCurrentDetail] = useState('Initializing AI pipeline…');
  const [logLines, setLogLines]     = useState([]);

  // Which property thumbnail is currently "active" (0-5)
  const [activePropIdx, setActivePropIdx] = useState(0);

  // Per-property status: { p1Steps: [], p2Steps: [], p1Done, p2Done }
  const [propStatuses, setPropStatuses] = useState(
    PROPERTIES_STREAM.map(() => ({ p1Steps: [], p2Steps: [], p1Done: false, p2Done: false }))
  );

  // Currently visible step list in the main feed
  const [feedPropIdx, setFeedPropIdx]   = useState(0);
  const [feedPhase, setFeedPhase]       = useState(1);
  const [feedSteps, setFeedSteps]       = useState([]); // array of { stepId, inputText, outputText }

  const totalStepsAll = PROPERTIES_STREAM.length * (PHASE1_STEPS.length + PHASE2_STEPS.length);
  const stepsPerProp1 = PHASE1_STEPS.length;
  const stepsPerProp2 = PHASE2_STEPS.length;
  const totalP1Steps  = PROPERTIES_STREAM.length * stepsPerProp1;

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  // ── Main animation driver ────────────────────────────────────────────────
  useEffect(() => {
    let stepsCompleted = 0;

    const addLog = (msg) => setLogLines((prev) => [...prev, msg]);

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

    const runProperty = async (pi, isPhase2) => {
      const prop  = PROPERTIES_STREAM[pi];
      const steps = isPhase2 ? PHASE2_STEPS : PHASE1_STEPS;

      setActivePropIdx(pi);
      setFeedPropIdx(pi);
      setFeedPhase(isPhase2 ? 2 : 1);
      setFeedSteps([]); // clear feed for this property

      for (let si = 0; si < steps.length; si++) {
        const step = steps[si];
        const inputText  = step.getInput(prop);
        const outputText = step.getOutput(prop);

        setCurrentDetail(`Prop ${prop.id} — ${step.label}…`);

        await sleep(STEP_DURATION_MS);

        // Reveal output in feed
        setFeedSteps((prev) => [
          ...prev,
          { stepId: step.id, label: step.label, inputText, outputText },
        ]);

        // Mark step done in propStatuses
        setPropStatuses((prev) => {
          const next = prev.map((s, i) => ({ ...s }));
          if (isPhase2) {
            next[pi].p2Steps = [...next[pi].p2Steps, step.id];
          } else {
            next[pi].p1Steps = [...next[pi].p1Steps, step.id];
          }
          return next;
        });

        // Log line
        addLog(`Prop ${prop.id} – ${step.label}`);

        stepsCompleted++;
        const pct = Math.round((stepsCompleted / totalStepsAll) * 100);
        setProgress(pct);
      }

      // Mark property phase done
      setPropStatuses((prev) => {
        const next = prev.map((s) => ({ ...s }));
        if (isPhase2) {
          next[pi].p2Done = true;
        } else {
          next[pi].p1Done = true;
        }
        return next;
      });
    };

    const run = async () => {
      await sleep(350);

      // Phase 1 — all 6 properties
      setPhase(1);
      for (let pi = 0; pi < PROPERTIES_STREAM.length; pi++) {
        await runProperty(pi, false);
      }

      // Brief pause at phase transition
      setCurrentDetail('Phase 1 complete — starting Quote Propensity Model…');
      await sleep(600);

      // Phase 2 — all 6 properties
      setPhase(2);
      setFeedSteps([]);
      for (let pi = 0; pi < PROPERTIES_STREAM.length; pi++) {
        await runProperty(pi, true);
      }

      setProgress(100);
      setDone(true);
      setCurrentDetail('All properties processed — pipeline complete.');
      await sleep(1200);
      navigate('/comparison', { state: { submissionId } });
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── JSX ──────────────────────────────────────────────────────────────────
  const currentFeedProp = PROPERTIES_STREAM[feedPropIdx];
  const allPhaseSteps   = feedPhase === 1 ? PHASE1_STEPS : PHASE2_STEPS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">

      {/* ── Header ── */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                title="Home"
                className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Risk Intelligence Engine</h1>
                <p className="text-xs text-gray-500 mt-0.5">Processing multi-layer underwriting signals in real time.</p>
              </div>
            </div>
            <span className="text-sm font-mono font-bold text-blue-600">{progress}%</span>
          </div>

          {/* Phase pills */}
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              phase === 1
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-green-100 border-green-300 text-green-700'
            }`}>
              {phase > 1
                ? <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                : <span className="w-3 h-3 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /></span>
              }
              Phase 1 — Property Insights
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              phase === 2
                ? done
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-blue-600 border-blue-600 text-white'
                : 'bg-gray-100 border-gray-200 text-gray-400'
            }`}>
              {done
                ? <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                : phase === 2
                  ? <span className="w-3 h-3 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /></span>
                  : <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
              }
              Phase 2 — Quote Propensity
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{currentDetail}</p>
        </div>
      </div>

      {/* ── 6 Property thumbnail strip ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-6 gap-2">
          {PROPERTIES_STREAM.map((prop, pi) => {
            const status  = propStatuses[pi];
            const isActive = pi === activePropIdx;
            return (
              <div
                key={prop.id}
                className={`relative rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  isActive
                    ? 'border-blue-500 shadow-md shadow-blue-100'
                    : status.p2Done
                      ? 'border-green-400'
                      : status.p1Done
                        ? 'border-blue-200'
                        : 'border-gray-200'
                }`}
              >
                <img
                  src={prop.imageUrl}
                  alt={`Property ${prop.id}`}
                  className="w-full h-16 object-cover"
                />
                {/* Property ID badge */}
                <div className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded leading-none">
                  {prop.id}
                </div>
                {/* Status overlay */}
                {isActive && !status.p2Done && (
                  <div className="absolute top-1 right-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    </span>
                  </div>
                )}
                {status.p2Done && (
                  <div className="absolute top-1 right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {status.p1Done && !status.p2Done && !isActive && (
                  <div className="absolute top-1 right-1 bg-blue-100 rounded-full w-4 h-4 flex items-center justify-center">
                    <span className="text-[8px] text-blue-700 font-bold">P1</span>
                  </div>
                )}
                {/* Bottom label */}
                <div className="bg-black/50 text-white text-[9px] text-center py-0.5 font-medium">
                  {prop.county.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row gap-4">

        {/* LEFT: Step feed */}
        <div className="flex-1 space-y-2 min-w-0">

          {/* Phase + property heading */}
          <div className="flex items-center gap-2">
            <span className="text-base">{feedPhase === 1 ? '🛰' : '🧠'}</span>
            <h2 className="text-sm font-semibold text-gray-700">
              {feedPhase === 1 ? 'Property Insights Model' : 'Quote Propensity Model'}
              {' — '}
              <span className="text-blue-600">Property {currentFeedProp?.id}</span>
              {' '}
              <span className="text-gray-400 font-normal text-xs">({currentFeedProp?.county})</span>
            </h2>
          </div>

          {/* Steps */}
          {allPhaseSteps.map((step, si) => {
            const done = feedSteps.find((s) => s.stepId === step.id);
            const isPending = !done;
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
                  done
                    ? 'bg-white border-blue-100 shadow-sm'
                    : 'bg-white/40 border-gray-200/60'
                }`}
              >
                {/* Circle */}
                <div className="flex-shrink-0 mt-0.5">
                  {done ? (
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {done && (
                    <>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <span className="font-medium text-gray-500">Input:</span> {done.inputText}
                      </p>
                      <p className="text-xs mt-1">
                        <span className="font-medium text-gray-500">Output:</span>{' '}
                        {/* Last step of each phase gets a colored badge */}
                        {(step.id === 'p1s5' || step.id === 'p2s6') ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold ${
                            step.id === 'p1s5'
                              ? riskBadge(currentFeedProp?.aiRisk)
                              : propBadge(currentFeedProp?.propensityCategory)
                          }`}>
                            {done.outputText}
                          </span>
                        ) : (
                          <span className="text-gray-700">{done.outputText}</span>
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Done banner */}
          {done && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mt-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-700 font-medium">Pipeline complete — navigating to comparison view…</span>
              <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
            </div>
          )}
        </div>

        {/* RIGHT: Activity log */}
        <div className="lg:w-64 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity Log</h3>
            {!done && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
            )}
          </div>
          <div
            ref={logRef}
            className="flex-1 bg-white border border-gray-200 rounded-lg p-3 overflow-y-auto max-h-[520px] font-mono text-xs space-y-1.5 shadow-sm"
          >
            {logLines.map((line, i) => (
              <div key={i} className="flex items-start gap-2 text-gray-700 animate-fadeIn">
                <span className="text-green-500 flex-shrink-0 font-bold">[✔]</span>
                <span>{line}</span>
              </div>
            ))}
            {logLines.length === 0 && (
              <span className="text-gray-400">Waiting for pipeline…</span>
            )}
          </div>
          {!done && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Processing all 6 properties…
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineAnimation;
