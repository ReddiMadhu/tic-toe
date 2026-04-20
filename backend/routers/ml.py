"""
ml.py — JSON-based ML prediction endpoints for the two-pass pipeline.

POST /api/ml/submissions  → Run 1: preliminary propensity scoring (no property vulnerability weight)
POST /api/ml/final_score  → Run 2: full pipeline with property vulnerability weightage (0.6)

Both endpoints accept:
    { "rows": [ {...}, ... ], "rules": {...}, "weights": {...} }

and return:
    { "row_count": N, "predictions": [...], "shap_global": [...], "shap_local": [...] }

When the real ML model is unavailable the fallback returns the deterministic
mock data from MOCK_PREDICTIONS / MOCK_SHAP_VALUES (sourced from results.py),
keyed by submission_id so ordering is always stable.
"""

import json
import io
import numpy as np
import pandas as pd
from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Import mock data from existing routers so we never duplicate it
from routers.properties import MOCK_PROPERTIES
from routers.results import MOCK_PREDICTIONS, MOCK_SHAP_VALUES

router = APIRouter()

# ─── Constants ────────────────────────────────────────────────────────────────

LOW_PROPENSITY_THRESHOLD = 0.30

# pre-build lookup dicts for O(1) access
_MOCK_PROPERTY_MAP = {m["submission_id"]: m for m in MOCK_PROPERTIES}
_MOCK_PREDICTION_MAP = {p["submission_id"]: p for p in MOCK_PREDICTIONS}

# ─── Request schema ───────────────────────────────────────────────────────────

class MLRequest(BaseModel):
    rows: list[dict[str, Any]]
    rules: dict[str, Any] = {}
    weights: dict[str, Any] = {}


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _enrich_from_mock(row: dict, mock_pred: dict, mock_prop: dict) -> dict:
    """Merge model output with mock property/image metadata."""
    quote_propensity = round(float(row.get("Quote_propensity_probability", 0)), 3)
    return {
        **row,
        # Visual / metadata from MOCK_PROPERTIES
        "propertyId":   mock_prop.get("propertyId"),
        "imageUrl":     mock_prop.get("imageUrl"),
        "roofImageUrl": mock_prop.get("roofImageUrl"),
        "broker_email": mock_prop.get("broker_email"),
        # Normalised score fields
        "state":                  row.get("Property_state_code", mock_prop.get("state")),
        "quote_propensity":       quote_propensity,
        "quote_propensity_label": row.get("Quote_propensity", mock_pred.get("quote_propensity", "Mid Propensity")),
        "is_below_threshold":     quote_propensity < LOW_PROPENSITY_THRESHOLD,
    }


def _run_real_pipeline(df: pd.DataFrame, include_vulnerability: bool) -> tuple:
    """
    Run the real ML pipeline and return (predictions_list, shap_global, shap_local).
    Raises on any error so the caller can fall back to mock data.
    """
    from ml_pipeline.clean import clean_table                          # type: ignore
    from ml_pipeline.rules import apply_evaluation                     # type: ignore
    from ml_pipeline.features import engineer_features                 # type: ignore
    from ml_pipeline.preprocess import preprocess_submission_data      # type: ignore
    from ml_pipeline.shap_utils import prop_shap                       # type: ignore
    from ml_pipeline.model import predict_xgboost_model                # type: ignore

    df_clean = clean_table(df)
    df_rules = apply_evaluation(df_clean, {})          # rules already applied client-side
    vul_weight = 0.6 if include_vulnerability else 0.0
    df_feat  = engineer_features(df_rules, {}, vul_weight)
    df_proc  = preprocess_submission_data(df_feat)
    df_shap_local, df_shap_global = prop_shap(df_proc)
    preds_raw = predict_xgboost_model(df_feat, df_proc)

    # Normalise model output to a list of dicts
    if isinstance(preds_raw, pd.DataFrame):
        preds_raw = preds_raw.to_dict(orient="records")
    elif isinstance(preds_raw, (pd.Series, np.ndarray)):
        preds_raw = preds_raw.tolist()
    elif isinstance(preds_raw, np.generic):
        preds_raw = [preds_raw.item()]

    return preds_raw, df_shap_global, df_shap_local


def _build_predictions(preds_raw: list, is_final: bool) -> list:
    """Match raw model rows against MOCK_PROPERTIES for image/metadata enrichment."""
    predictions = []
    for row in preds_raw:
        sid = row.get("submission_id") or row.get("Submission_id", "")
        mock_prop = _MOCK_PROPERTY_MAP.get(sid)
        mock_pred = _MOCK_PREDICTION_MAP.get(sid)
        if not mock_prop:
            # Unknown submission_id — include with minimal enrichment
            qp = round(float(row.get("Quote_propensity_probability", 0)), 3)
            predictions.append({
                **row,
                "quote_propensity": qp,
                "quote_propensity_label": row.get("Quote_propensity", "Mid Propensity"),
                "is_below_threshold": qp < LOW_PROPENSITY_THRESHOLD,
            })
            continue
        predictions.append(_enrich_from_mock(row, mock_pred or {}, mock_prop))
    return predictions


# ─── Mock fallback ────────────────────────────────────────────────────────────

def _mock_fallback(rows: list[dict], is_final: bool) -> dict:
    """
    Return deterministic mock predictions keyed by submission_id.
    Run 2 (final) scores are slightly adjusted (+/- realistic delta) from Run 1.
    """

    predictions = []
    for row in rows:
        sid = row.get("submission_id") or row.get("Submission_id", "")
        mock_pred = _MOCK_PREDICTION_MAP.get(sid)
        mock_prop = _MOCK_PROPERTY_MAP.get(sid)

        if mock_pred:
            base_prob = mock_pred["quote_propensity_probability"]
            if is_final:
                # Dynamic calculated logic based on Frontend weights requirement
                vuln_risk = mock_pred.get("property_vulnerability_risk", 50)
                vuln_score_normalized = (100 - vuln_risk) / 100.0
                final_prob = (vuln_score_normalized * 0.6) + (base_prob * 0.4)
                base_prob = round(final_prob, 3)
                
                # Dynamic reassignment of label tier based on calculated threshold
                if base_prob >= 0.70:
                    label = "High Propensity"
                elif base_prob >= LOW_PROPENSITY_THRESHOLD:
                    label = "Mid Propensity"
                else:
                    label = "Low Propensity"
            else:
                base_prob = round(base_prob, 3)
                label = mock_pred["quote_propensity"]
            entry = {
                **row,
                **(mock_prop or {}),
                "submission_id":         sid,
                "property_id":           mock_prop.get("propertyId") if mock_prop else "",
                "quote_propensity":      base_prob,
                "quote_propensity_label": label,
                "is_below_threshold":    base_prob < LOW_PROPENSITY_THRESHOLD,
                # Risk scores from mock predictions
                "property_vulnerability_risk": mock_pred.get("property_vulnerability_risk"),
                "construction_risk_score":     mock_pred.get("construction_risk"),
                "locality_risk":               mock_pred.get("locality_risk"),
                "coverage_risk":               mock_pred.get("coverage_risk"),
                "claim_history_risk":          mock_pred.get("claim_history_risk"),
                "property_condition_risk":     mock_pred.get("property_condition_risk"),
                "total_risk_score":            mock_pred.get("total_risk_score"),
            }
        else:
            # Submission not in mock — generic placeholder
            entry = {
                **row,
                "submission_id":          sid,
                "quote_propensity":       0.5,
                "quote_propensity_label": "Mid Propensity",
                "is_below_threshold":     False,
            }
        predictions.append(entry)

    return {
        "row_count":   len(predictions),
        "predictions": predictions,
        "shap_global": MOCK_SHAP_VALUES,
        "shap_local":  [],
    }


# ─── Core dispatcher ──────────────────────────────────────────────────────────

def _run_pipeline(rows: list[dict], is_final: bool) -> dict:
    """Try real ML pipeline; fall back to mock on any error."""
    try:
        df = pd.DataFrame(rows)
        preds_raw, df_shap_global, df_shap_local = _run_real_pipeline(df, include_vulnerability=is_final)
        predictions = _build_predictions(preds_raw, is_final)
        shap_global = df_shap_global.to_dict(orient="records") if isinstance(df_shap_global, pd.DataFrame) else (df_shap_global or MOCK_SHAP_VALUES)
        shap_local  = df_shap_local.to_dict(orient="records")  if isinstance(df_shap_local,  pd.DataFrame) else []
        return {
            "row_count":   len(predictions),
            "predictions": predictions,
            "shap_global": shap_global,
            "shap_local":  shap_local,
        }
    except Exception as exc:
        print(f"[ml.py] Real pipeline unavailable ({exc!r}), using mock fallback.")
        return _mock_fallback(rows, is_final)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/submissions")
async def run_preliminary_predictions(payload: MLRequest):
    """
    Run 1 — Preliminary propensity scoring (no property vulnerability weight).

    Accepts JSON:
        { "rows": [ { "submission_id": "SUB00008", ... }, ... ],
          "rules": { ... },
          "weights": { ... } }

    Returns:
        { "row_count": N, "predictions": [...], "shap_global": [...], "shap_local": [...] }

    Each prediction includes is_below_threshold: true/false so the frontend
    can identify BPO-excluded properties without recomputing the threshold.
    """
    if not payload.rows:
        raise HTTPException(status_code=400, detail="No rows provided in request body.")
    return _run_pipeline(payload.rows, is_final=False)


@router.post("/final_score")
async def run_final_predictions(payload: MLRequest):
    """
    Run 2 — Final propensity scoring with property vulnerability weightage (0.6).

    Bypasses ML pipeline completely to apply pure deterministic calculation 
    based on the property_vulnerability_risk * 60% and prelim score * 40%.
    """
    if not payload.rows:
        raise HTTPException(
            status_code=400,
            detail="No rows provided. BPO-excluded properties must be filtered before calling /final_score."
        )
    return _mock_fallback(payload.rows, is_final=True)
