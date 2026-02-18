import json
import random

# Mock property scores — keyed by property_id (1-6)
MOCK_SCORES = {
    1: {"ai_risk": "Medium", "quote_propensity": 0.68, "total_risk_score": 0.62},
    2: {"ai_risk": "High",   "quote_propensity": 0.82, "total_risk_score": 0.81},
    3: {"ai_risk": "Low",    "quote_propensity": 0.35, "total_risk_score": 0.30},
    4: {"ai_risk": "High",   "quote_propensity": 0.77, "total_risk_score": 0.78},
    5: {"ai_risk": "Medium", "quote_propensity": 0.61, "total_risk_score": 0.55},
    6: {"ai_risk": "Low",    "quote_propensity": 0.28, "total_risk_score": 0.25},
}

# Mock SHAP values per property
MOCK_SHAP = {
    1: [
        {"feature": "annual_income",              "contribution": 1.050},
        {"feature": "building_coverage_limit",    "contribution": 0.853},
        {"feature": "cover_type_Building_Only",   "contribution": 0.692},
        {"feature": "Property_past_loss_freq",    "contribution": 0.519},
        {"feature": "construction_permit_Valid",  "contribution": 0.345},
        {"feature": "property_age",               "contribution": 0.276},
        {"feature": "total_risk_score",           "contribution": 0.250},
        {"feature": "Local_Crime_Rate",           "contribution": -0.247},
        {"feature": "roof_material_Wood",         "contribution": 0.217},
        {"feature": "Local_Fire_Incident_Rate",   "contribution": -0.203},
    ],
    2: [
        {"feature": "property_age",               "contribution": 1.20},
        {"feature": "Local_Fire_Incident_Rate",   "contribution": 0.95},
        {"feature": "roof_material_Wood",         "contribution": 0.88},
        {"feature": "Property_past_loss_freq",    "contribution": 0.72},
        {"feature": "Wildfire_Exposure",          "contribution": 0.65},
        {"feature": "building_coverage_limit",    "contribution": -0.41},
        {"feature": "construction_permit_Valid",  "contribution": -0.38},
        {"feature": "Local_Crime_Rate",           "contribution": 0.35},
        {"feature": "annual_income",              "contribution": -0.29},
        {"feature": "cover_type_Building_Only",   "contribution": 0.21},
    ],
    3: [
        {"feature": "annual_income",              "contribution": -0.92},
        {"feature": "building_coverage_limit",    "contribution": -0.78},
        {"feature": "property_age",               "contribution": -0.64},
        {"feature": "construction_permit_Valid",  "contribution": 0.42},
        {"feature": "Local_Crime_Rate",           "contribution": -0.38},
        {"feature": "cover_type_Building_Only",   "contribution": -0.31},
        {"feature": "Local_Fire_Incident_Rate",   "contribution": 0.28},
        {"feature": "Property_past_loss_freq",    "contribution": -0.22},
        {"feature": "roof_material_Wood",         "contribution": 0.18},
        {"feature": "total_risk_score",           "contribution": -0.15},
    ],
    4: [
        {"feature": "property_age",               "contribution": 1.45},
        {"feature": "Wildfire_Exposure",          "contribution": 1.12},
        {"feature": "Local_Fire_Incident_Rate",   "contribution": 0.98},
        {"feature": "roof_material_Wood",         "contribution": 0.82},
        {"feature": "Property_past_loss_freq",    "contribution": 0.74},
        {"feature": "Local_Crime_Rate",           "contribution": 0.58},
        {"feature": "total_risk_score",           "contribution": 0.51},
        {"feature": "building_coverage_limit",    "contribution": -0.39},
        {"feature": "annual_income",              "contribution": -0.28},
        {"feature": "construction_permit_Valid",  "contribution": -0.21},
    ],
    5: [
        {"feature": "annual_income",              "contribution": 0.88},
        {"feature": "cover_type_Building_Only",   "contribution": 0.72},
        {"feature": "building_coverage_limit",    "contribution": 0.64},
        {"feature": "property_age",               "contribution": -0.55},
        {"feature": "Property_past_loss_freq",    "contribution": 0.48},
        {"feature": "Local_Crime_Rate",           "contribution": -0.41},
        {"feature": "construction_permit_Valid",  "contribution": 0.35},
        {"feature": "roof_material_Wood",         "contribution": 0.29},
        {"feature": "Wildfire_Exposure",          "contribution": -0.22},
        {"feature": "total_risk_score",           "contribution": 0.18},
    ],
    6: [
        {"feature": "annual_income",              "contribution": -0.75},
        {"feature": "property_age",               "contribution": -0.62},
        {"feature": "building_coverage_limit",    "contribution": -0.54},
        {"feature": "construction_permit_Valid",  "contribution": -0.45},
        {"feature": "Local_Crime_Rate",           "contribution": 0.38},
        {"feature": "Property_past_loss_freq",    "contribution": -0.32},
        {"feature": "roof_material_Wood",         "contribution": 0.28},
        {"feature": "cover_type_Building_Only",   "contribution": -0.24},
        {"feature": "Local_Fire_Incident_Rate",   "contribution": 0.20},
        {"feature": "total_risk_score",           "contribution": -0.16},
    ],
}

# Mock vulnerability data per property
MOCK_VULNERABILITY = {
    1: {
        "roof_detection": {
            "condition": "Fair",
            "damage_areas": ["NW corner wear", "Flashing separation at chimney"],
            "material": "Asphalt Shingle",
            "age_estimate": "16-20 years",
            "confidence": 0.87,
        },
        "proximity": {
            "wildfire_zone": "Moderate (2.8 mi to WUI boundary)",
            "hurricane_zone": "Category 1 exposure",
            "fault_line": "4.2 mi to nearest active fault",
            "flood_zone": "Zone X (minimal risk)",
        },
        "object_detection": {
            "findings": [
                {"label": "Roof surface wear",      "confidence": 0.91, "risk": "Medium"},
                {"label": "Overhanging tree",       "confidence": 0.84, "risk": "Low"},
                {"label": "HVAC unit proximity",    "confidence": 0.78, "risk": "Low"},
            ],
            "model": "YOLOv8-property-v2",
        },
    },
    2: {
        "roof_detection": {
            "condition": "Poor",
            "damage_areas": ["Missing shingles (east section)", "Visible granule loss", "Moss growth"],
            "material": "Wood Shake",
            "age_estimate": "22-28 years",
            "confidence": 0.92,
        },
        "proximity": {
            "wildfire_zone": "High (0.9 mi to WUI boundary)",
            "hurricane_zone": "Category 2-3 exposure",
            "fault_line": "1.8 mi to active fault",
            "flood_zone": "Zone AE (high risk)",
        },
        "object_detection": {
            "findings": [
                {"label": "Missing shingles",       "confidence": 0.95, "risk": "High"},
                {"label": "Dense vegetation",       "confidence": 0.89, "risk": "High"},
                {"label": "Cracked chimney cap",    "confidence": 0.83, "risk": "Medium"},
                {"label": "Blocked gutters",        "confidence": 0.77, "risk": "Medium"},
            ],
            "model": "YOLOv8-property-v2",
        },
    },
    3: {
        "roof_detection": {
            "condition": "Excellent",
            "damage_areas": [],
            "material": "Metal Standing Seam",
            "age_estimate": "3-6 years",
            "confidence": 0.96,
        },
        "proximity": {
            "wildfire_zone": "Low (6.1 mi to WUI boundary)",
            "hurricane_zone": "Category 1 exposure (coastal setback met)",
            "fault_line": "12.4 mi to nearest fault",
            "flood_zone": "Zone X (minimal risk)",
        },
        "object_detection": {
            "findings": [
                {"label": "Solar panel installation", "confidence": 0.93, "risk": "Low"},
                {"label": "New guttering system",     "confidence": 0.88, "risk": "Low"},
            ],
            "model": "YOLOv8-property-v2",
        },
    },
    4: {
        "roof_detection": {
            "condition": "Critical",
            "damage_areas": ["Sagging ridge line", "Multiple missing tiles", "Water staining visible", "Structural deformation"],
            "material": "Clay Tile",
            "age_estimate": "32-40 years",
            "confidence": 0.94,
        },
        "proximity": {
            "wildfire_zone": "Very High (0.3 mi to WUI boundary)",
            "hurricane_zone": "Category 3-4 exposure",
            "fault_line": "0.9 mi to active fault",
            "flood_zone": "Zone A (high risk, no BFE)",
        },
        "object_detection": {
            "findings": [
                {"label": "Severe roof damage",     "confidence": 0.97, "risk": "High"},
                {"label": "Foundation cracks",      "confidence": 0.88, "risk": "High"},
                {"label": "Dead trees (3)",         "confidence": 0.92, "risk": "High"},
                {"label": "Debris accumulation",    "confidence": 0.85, "risk": "Medium"},
                {"label": "Deck structural wear",   "confidence": 0.79, "risk": "Medium"},
            ],
            "model": "YOLOv8-property-v2",
        },
    },
    5: {
        "roof_detection": {
            "condition": "Good",
            "damage_areas": ["Minor granule loss (south slope)"],
            "material": "Asphalt Shingle",
            "age_estimate": "10-14 years",
            "confidence": 0.89,
        },
        "proximity": {
            "wildfire_zone": "Low-Moderate (3.5 mi to WUI boundary)",
            "hurricane_zone": "Category 1 exposure",
            "fault_line": "7.2 mi to nearest fault",
            "flood_zone": "Zone X (minimal risk)",
        },
        "object_detection": {
            "findings": [
                {"label": "Minor shingle wear",     "confidence": 0.86, "risk": "Low"},
                {"label": "Pool proximity",         "confidence": 0.91, "risk": "Low"},
                {"label": "Driveway in good repair","confidence": 0.82, "risk": "Low"},
            ],
            "model": "YOLOv8-property-v2",
        },
    },
    6: {
        "roof_detection": {
            "condition": "Good",
            "damage_areas": [],
            "material": "Composite Shingle",
            "age_estimate": "6-9 years",
            "confidence": 0.91,
        },
        "proximity": {
            "wildfire_zone": "Low (5.2 mi to WUI boundary)",
            "hurricane_zone": "Category 1 exposure",
            "fault_line": "9.8 mi to nearest fault",
            "flood_zone": "Zone X (minimal risk)",
        },
        "object_detection": {
            "findings": [
                {"label": "Clean roof surface",     "confidence": 0.94, "risk": "Low"},
                {"label": "Well-maintained yard",   "confidence": 0.87, "risk": "Low"},
            ],
            "model": "YOLOv8-property-v2",
        },
    },
}


def run_mock_ml(property_ids: list[int]) -> list[dict]:
    """Return mock ML results for given property IDs."""
    results = []
    for pid in property_ids:
        score = MOCK_SCORES.get(pid, {"ai_risk": "Medium", "quote_propensity": 0.5, "total_risk_score": 0.5})
        shap = MOCK_SHAP.get(pid, [])
        vuln = MOCK_VULNERABILITY.get(pid, {})
        results.append({
            "property_id": pid,
            "ai_risk": score["ai_risk"],
            "quote_propensity": score["quote_propensity"],
            "total_risk_score": score["total_risk_score"],
            "shap_values": json.dumps(shap),
            "vulnerability_data": json.dumps(vuln),
        })
    return results


def run_real_ml(property_ids: list[int]) -> list[dict]:
    """
    Placeholder for real ML model integration.
    Replace this function body with actual model calls.
    Expected: load pickle/ONNX model, prepare features, run inference.
    Must return same shape as run_mock_ml().
    """
    raise NotImplementedError("Real ML model not yet integrated. Using mock fallback.")


def run_ml_pipeline(property_ids: list[int]) -> list[dict]:
    """Try real ML, fall back to mock on any error."""
    try:
        return run_real_ml(property_ids)
    except Exception:
        return run_mock_ml(property_ids)
