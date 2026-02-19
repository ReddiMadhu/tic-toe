import json
from fastapi import APIRouter, HTTPException
from database import get_connection

router = APIRouter()

# Real ML prediction data — fallback when DB has no process_results yet
MOCK_PREDICTIONS = [
    {
        "submission_id": "SUB0001",
        "submission_channel": "Broker",
        "property_state": "Massachusetts",
        "occupancy_type": "Vacant",
        "cover_type": "Contents Only",
        "property_vulnerability_risk": 75,
        "construction_risk": 49,
        "locality_risk": 39,
        "coverage_risk": 61,
        "claim_history_risk": 11,
        "property_condition_risk": 33,
        "broker_performance": 38,
        "total_risk_score": 46,
        "quote_propensity_probability": 0.8980314635,
        "quote_propensity": "High Propensity",
    },
    {
        "submission_id": "SUB0002",
        "submission_channel": "Broker",
        "property_state": "Missouri",
        "occupancy_type": "Primary Residence",
        "cover_type": "Contents Only",
        "property_vulnerability_risk": 60,
        "construction_risk": 44,
        "locality_risk": 23,
        "coverage_risk": 64,
        "claim_history_risk": 34,
        "property_condition_risk": 19,
        "broker_performance": 46,
        "total_risk_score": 38,
        "quote_propensity_probability": 0.9307270536,
        "quote_propensity": "High Propensity",
    },
    {
        "submission_id": "SUB0003",
        "submission_channel": "Online",
        "property_state": "Missouri",
        "occupancy_type": "Rental Property",
        "cover_type": "Building Only",
        "property_vulnerability_risk": 85,
        "construction_risk": 45,
        "locality_risk": 18,
        "coverage_risk": 70,
        "claim_history_risk": 47,
        "property_condition_risk": 31,
        "broker_performance": 50,
        "total_risk_score": 45,
        "quote_propensity_probability": 0.8465048576,
        "quote_propensity": "High Propensity",
    },
    {
        "submission_id": "SUB0008",
        "submission_channel": "Online",
        "property_state": "Texas",
        "occupancy_type": "Rental Property",
        "cover_type": "Both",
        "property_vulnerability_risk": 95,
        "construction_risk": 39,
        "locality_risk": 43,
        "coverage_risk": 78,
        "claim_history_risk": 34,
        "property_condition_risk": 31,
        "broker_performance": 50,
        "total_risk_score": 54,
        "quote_propensity_probability": 0.4319356302,
        "quote_propensity": "Mid Propensity",
    },
    {
        "submission_id": "SUB0011",
        "submission_channel": "Broker",
        "property_state": "Florida",
        "occupancy_type": "Secondary Home",
        "cover_type": "Contents Only",
        "property_vulnerability_risk": 85,
        "construction_risk": 44,
        "locality_risk": 14,
        "coverage_risk": 61,
        "claim_history_risk": 11,
        "property_condition_risk": 23,
        "broker_performance": 31,
        "total_risk_score": 38,
        "quote_propensity_probability": 0.4516881039,
        "quote_propensity": "Mid Propensity",
    },
    {
        "submission_id": "SUB0012",
        "submission_channel": "Broker",
        "property_state": "Nevada",
        "occupancy_type": "Secondary Home",
        "cover_type": "Building Only",
        "property_vulnerability_risk": 95,
        "construction_risk": 45,
        "locality_risk": 30,
        "coverage_risk": 64,
        "claim_history_risk": 22,
        "property_condition_risk": 27,
        "broker_performance": 35,
        "total_risk_score": 47,
        "quote_propensity_probability": 0.0357155295,
        "quote_propensity": "Low Propensity",
    },
]

# Map integer property_id (1-6) to submission_id string ("SUB0001" etc.)
PROPERTY_ID_TO_SUBMISSION = {
    i + 1: MOCK_PREDICTIONS[i]["submission_id"]
    for i in range(len(MOCK_PREDICTIONS))
}

# Global SHAP — aggregate importance across all properties
MOCK_SHAP_VALUES = [
    {"feature": "annual_income",              "mean_abs_shap": 1.0503328722},
    {"feature": "building_coverage_limit",    "mean_abs_shap": 0.8539392781},
    {"feature": "cover_type_Building Only",   "mean_abs_shap": 0.6925647273},
    {"feature": "Property_past_loss_freq",    "mean_abs_shap": 0.5195329826},
    {"feature": "construction_permit_Valid",  "mean_abs_shap": 0.3455599508},
    {"feature": "property_age",               "mean_abs_shap": 0.2762477040},
    {"feature": "total_risk_score",           "mean_abs_shap": 0.2502020624},
    {"feature": "Local_Crime_Rate",           "mean_abs_shap": 0.2475460512},
    {"feature": "roof_material_Wood",         "mean_abs_shap": 0.2170172029},
    {"feature": "Local_Fire_Incident_Rate",   "mean_abs_shap": 0.2033794492},
]

# Per-property local SHAP values (A–F) — random but realistic variation
MOCK_LOCAL_SHAP = [
    # A — SUB00001 (High Propensity, high vulnerability)
    [
        {"feature": "annual_income",              "mean_abs_shap": 1.2841},
        {"feature": "building_coverage_limit",    "mean_abs_shap": 0.9103},
        {"feature": "Property_past_loss_freq",    "mean_abs_shap": 0.7812},
        {"feature": "cover_type_Building Only",   "mean_abs_shap": 0.6124},
        {"feature": "total_risk_score",           "mean_abs_shap": 0.4903},
        {"feature": "property_age",               "mean_abs_shap": 0.3571},
        {"feature": "roof_material_Wood",         "mean_abs_shap": 0.3214},
        {"feature": "Local_Fire_Incident_Rate",   "mean_abs_shap": 0.2987},
        {"feature": "construction_permit_Valid",  "mean_abs_shap": 0.2415},
        {"feature": "Local_Crime_Rate",           "mean_abs_shap": 0.1932},
    ],
    # B — SUB00002 (High Propensity, poor roof)
    [
        {"feature": "annual_income",              "mean_abs_shap": 1.1674},
        {"feature": "cover_type_Building Only",   "mean_abs_shap": 0.8920},
        {"feature": "building_coverage_limit",    "mean_abs_shap": 0.7543},
        {"feature": "Local_Fire_Incident_Rate",   "mean_abs_shap": 0.6218},
        {"feature": "Property_past_loss_freq",    "mean_abs_shap": 0.5431},
        {"feature": "roof_material_Wood",         "mean_abs_shap": 0.4867},
        {"feature": "total_risk_score",           "mean_abs_shap": 0.3102},
        {"feature": "property_age",               "mean_abs_shap": 0.2784},
        {"feature": "Local_Crime_Rate",           "mean_abs_shap": 0.2341},
        {"feature": "construction_permit_Valid",  "mean_abs_shap": 0.1893},
    ],
    # C — SUB00003 (High Propensity, excellent roof)
    [
        {"feature": "building_coverage_limit",    "mean_abs_shap": 1.0231},
        {"feature": "annual_income",              "mean_abs_shap": 0.9872},
        {"feature": "cover_type_Building Only",   "mean_abs_shap": 0.7614},
        {"feature": "Property_past_loss_freq",    "mean_abs_shap": 0.6043},
        {"feature": "construction_permit_Valid",  "mean_abs_shap": 0.4312},
        {"feature": "total_risk_score",           "mean_abs_shap": 0.3187},
        {"feature": "property_age",               "mean_abs_shap": 0.2543},
        {"feature": "Local_Crime_Rate",           "mean_abs_shap": 0.2198},
        {"feature": "roof_material_Wood",         "mean_abs_shap": 0.1874},
        {"feature": "Local_Fire_Incident_Rate",   "mean_abs_shap": 0.1521},
    ],
    # D — SUB00008 (Mid Propensity, critical roof)
    [
        {"feature": "total_risk_score",           "mean_abs_shap": 1.1043},
        {"feature": "Property_past_loss_freq",    "mean_abs_shap": 0.8762},
        {"feature": "annual_income",              "mean_abs_shap": 0.7981},
        {"feature": "Local_Fire_Incident_Rate",   "mean_abs_shap": 0.6534},
        {"feature": "building_coverage_limit",    "mean_abs_shap": 0.5217},
        {"feature": "cover_type_Building Only",   "mean_abs_shap": 0.4389},
        {"feature": "Local_Crime_Rate",           "mean_abs_shap": 0.3812},
        {"feature": "roof_material_Wood",         "mean_abs_shap": 0.3104},
        {"feature": "construction_permit_Valid",  "mean_abs_shap": 0.2673},
        {"feature": "property_age",               "mean_abs_shap": 0.2241},
    ],
    # E — SUB00011 (Mid Propensity, good roof)
    [
        {"feature": "annual_income",              "mean_abs_shap": 0.9812},
        {"feature": "building_coverage_limit",    "mean_abs_shap": 0.8134},
        {"feature": "construction_permit_Valid",  "mean_abs_shap": 0.6743},
        {"feature": "Property_past_loss_freq",    "mean_abs_shap": 0.4921},
        {"feature": "cover_type_Building Only",   "mean_abs_shap": 0.4103},
        {"feature": "property_age",               "mean_abs_shap": 0.3487},
        {"feature": "total_risk_score",           "mean_abs_shap": 0.2934},
        {"feature": "Local_Crime_Rate",           "mean_abs_shap": 0.2512},
        {"feature": "roof_material_Wood",         "mean_abs_shap": 0.2087},
        {"feature": "Local_Fire_Incident_Rate",   "mean_abs_shap": 0.1743},
    ],
    # F — SUB00012 (Low Propensity, good roof)
    [
        {"feature": "cover_type_Building Only",   "mean_abs_shap": 0.8934},
        {"feature": "annual_income",              "mean_abs_shap": 0.7821},
        {"feature": "building_coverage_limit",    "mean_abs_shap": 0.6312},
        {"feature": "construction_permit_Valid",  "mean_abs_shap": 0.5187},
        {"feature": "property_age",               "mean_abs_shap": 0.3924},
        {"feature": "Property_past_loss_freq",    "mean_abs_shap": 0.3214},
        {"feature": "Local_Crime_Rate",           "mean_abs_shap": 0.2743},
        {"feature": "total_risk_score",           "mean_abs_shap": 0.2187},
        {"feature": "roof_material_Wood",         "mean_abs_shap": 0.1893},
        {"feature": "Local_Fire_Incident_Rate",   "mean_abs_shap": 0.1432},
    ],
]

# Vulnerability data per position (A–F) for mock
MOCK_VULNERABILITY = [
    {
        "roof_detection": {"condition": "Fair", "damage_areas": ["NW corner wear", "Flashing separation at chimney"], "material": "Asphalt Shingle", "age_estimate": "16-20 years", "confidence": 0.87},
        "proximity": {"wildfire_zone": "Moderate (2.8 mi to WUI boundary)", "hurricane_zone": "Category 1 exposure", "fault_line": "4.2 mi to nearest active fault", "flood_zone": "Zone X (minimal risk)"},
        "object_detection": {"findings": [{"label": "Roof surface wear", "confidence": 0.91, "risk": "Medium"}, {"label": "Overhanging tree", "confidence": 0.84, "risk": "Low"}], "model": "YOLOv8-property-v2"},
    },
    {
        "roof_detection": {"condition": "Poor", "damage_areas": ["Missing shingles (east section)", "Visible granule loss", "Moss growth"], "material": "Wood Shake", "age_estimate": "22-28 years", "confidence": 0.92},
        "proximity": {"wildfire_zone": "High (0.9 mi to WUI boundary)", "hurricane_zone": "Category 2-3 exposure", "fault_line": "1.8 mi to active fault", "flood_zone": "Zone AE (high risk)"},
        "object_detection": {"findings": [{"label": "Missing shingles", "confidence": 0.95, "risk": "High"}, {"label": "Dense vegetation", "confidence": 0.89, "risk": "High"}, {"label": "Cracked chimney cap", "confidence": 0.83, "risk": "Medium"}], "model": "YOLOv8-property-v2"},
    },
    {
        "roof_detection": {"condition": "Excellent", "damage_areas": [], "material": "Metal Standing Seam", "age_estimate": "3-6 years", "confidence": 0.96},
        "proximity": {"wildfire_zone": "Low (6.1 mi to WUI boundary)", "hurricane_zone": "Category 1 exposure (coastal setback met)", "fault_line": "12.4 mi to nearest fault", "flood_zone": "Zone X (minimal risk)"},
        "object_detection": {"findings": [{"label": "Solar panel installation", "confidence": 0.93, "risk": "Low"}, {"label": "New guttering system", "confidence": 0.88, "risk": "Low"}], "model": "YOLOv8-property-v2"},
    },
    {
        "roof_detection": {"condition": "Critical", "damage_areas": ["Sagging ridge line", "Multiple missing tiles", "Water staining visible"], "material": "Clay Tile", "age_estimate": "32-40 years", "confidence": 0.94},
        "proximity": {"wildfire_zone": "Very High (0.3 mi to WUI boundary)", "hurricane_zone": "Category 3-4 exposure", "fault_line": "0.9 mi to active fault", "flood_zone": "Zone A (high risk, no BFE)"},
        "object_detection": {"findings": [{"label": "Severe roof damage", "confidence": 0.97, "risk": "High"}, {"label": "Foundation cracks", "confidence": 0.88, "risk": "High"}, {"label": "Dead trees (3)", "confidence": 0.92, "risk": "High"}], "model": "YOLOv8-property-v2"},
    },
    {
        "roof_detection": {"condition": "Good", "damage_areas": ["Minor granule loss (south slope)"], "material": "Asphalt Shingle", "age_estimate": "10-14 years", "confidence": 0.89},
        "proximity": {"wildfire_zone": "Low-Moderate (3.5 mi to WUI boundary)", "hurricane_zone": "Category 1 exposure", "fault_line": "7.2 mi to nearest fault", "flood_zone": "Zone X (minimal risk)"},
        "object_detection": {"findings": [{"label": "Minor shingle wear", "confidence": 0.86, "risk": "Low"}, {"label": "Pool proximity", "confidence": 0.91, "risk": "Low"}], "model": "YOLOv8-property-v2"},
    },
    {
        "roof_detection": {"condition": "Good", "damage_areas": [], "material": "Composite Shingle", "age_estimate": "6-9 years", "confidence": 0.91},
        "proximity": {"wildfire_zone": "Low (5.2 mi to WUI boundary)", "hurricane_zone": "Category 1 exposure", "fault_line": "9.8 mi to nearest fault", "flood_zone": "Zone X (minimal risk)"},
        "object_detection": {"findings": [{"label": "Clean roof surface", "confidence": 0.94, "risk": "Low"}, {"label": "Well-maintained yard", "confidence": 0.87, "risk": "Low"}], "model": "YOLOv8-property-v2"},
    },
]


def _propensity_to_risk(propensity_label: str) -> str:
    label = propensity_label.lower()
    if "high" in label:
        return "High"
    if "mid" in label or "medium" in label:
        return "Medium"
    return "Low"


def _build_mock_results(submission_id, underwriter_name="Demo User", prioritized_ids=None, discarded_ids=None):
    """Build results from MOCK_PREDICTIONS for fallback."""
    prioritized_ids = prioritized_ids or []
    discarded_ids = discarded_ids or []
    results = []
    for i, pred in enumerate(MOCK_PREDICTIONS):
        sid = pred["submission_id"]
        user_selection = None
        if sid in prioritized_ids:
            user_selection = "prioritized"
        elif sid in discarded_ids:
            user_selection = "discarded"

        results.append({
            "submission_id": sid,
            "property_index": i,           # 0-based position (A=0, B=1…)
            "user_selection": user_selection,
            "quote_propensity": pred["quote_propensity_probability"],
            "quote_propensity_label": pred["quote_propensity"],
            "total_risk_score": pred["total_risk_score"],
            "property_vulnerability_risk": pred["property_vulnerability_risk"],
            "construction_risk_score": pred["construction_risk"],
            "locality_risk": pred["locality_risk"],
            "coverage_risk": pred["coverage_risk"],
            "claim_history_risk": pred["claim_history_risk"],
            "property_condition_risk": pred["property_condition_risk"],
            "broker_performance": pred["broker_performance"],
            "property_state": pred["property_state"],
            "occupancy_type": pred["occupancy_type"],
            "cover_type": pred["cover_type"],
            "submission_channel": pred["submission_channel"],
            "shap_values": MOCK_LOCAL_SHAP[i],
            "vulnerability_data": MOCK_VULNERABILITY[i],
        })

    # Compute score inline (can't call _compute_score here as it's defined below)
    points = 0.0
    for r in results:
        label = (r.get("quote_propensity_label") or "").lower()
        sel = r.get("user_selection")
        tier = "High" if "high" in label else "Mid" if "mid" in label else "Low"
        if sel == "prioritized":
            if tier == "High": points += 1.0
            elif tier == "Mid": points += 0.5
        elif sel == "discarded":
            if tier == "Low": points += 1.0
            elif tier == "Mid": points += 0.5
    score_pct = round((points / 6.0) * 100, 1)

    return {
        "submission_id": submission_id,
        "underwriter_name": underwriter_name,
        "score_percentage": score_pct,
        "results": results,
        "global_shap": MOCK_SHAP_VALUES,
    }


def _compute_score(results_list: list) -> float:
    """Compute alignment score from results list (user_selection vs quote_propensity_label)."""
    points = 0.0
    for r in results_list:
        label = (r.get("quote_propensity_label") or "").lower()
        sel = r.get("user_selection")
        tier = "High" if "high" in label else "Mid" if "mid" in label else "Low"
        if sel == "prioritized":
            if tier == "High":
                points += 1.0
            elif tier == "Mid":
                points += 0.5
        elif sel == "discarded":
            if tier == "Low":
                points += 1.0
            elif tier == "Mid":
                points += 0.5
    return points


@router.get("/{submission_id}")
def get_results(submission_id: str):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM submissions WHERE id = ?", (submission_id,))
        submission = cursor.fetchone()
        if not submission:
            # Return mock data keyed to this submission_id
            return _build_mock_results(submission_id)

        prioritized_ids = json.loads(submission["prioritized_ids"])
        discarded_ids   = json.loads(submission["discarded_ids"])

        cursor.execute(
            "SELECT * FROM process_results WHERE submission_id = ? ORDER BY property_id",
            (submission_id,),
        )
        rows = cursor.fetchall()

        if not rows:
            return _build_mock_results(
                submission_id,
                underwriter_name=submission["underwriter_name"],
                prioritized_ids=prioritized_ids,
                discarded_ids=discarded_ids,
            )

        results = []
        for i, row in enumerate(rows):
            pid = row["property_id"]
            submission_id_str = PROPERTY_ID_TO_SUBMISSION.get(pid, str(pid))
            user_selection = None
            if submission_id_str in prioritized_ids:
                user_selection = "prioritized"
            elif submission_id_str in discarded_ids:
                user_selection = "discarded"

            pred = MOCK_PREDICTIONS[i % len(MOCK_PREDICTIONS)]
            results.append({
                "submission_id": pred["submission_id"],
                "property_index": i,
                "user_selection": user_selection,
                "quote_propensity": row["quote_propensity"],
                "quote_propensity_label": pred["quote_propensity"],
                "total_risk_score": pred["total_risk_score"],
                "property_vulnerability_risk": pred["property_vulnerability_risk"],
                "construction_risk_score": pred["construction_risk"],
                "locality_risk": pred["locality_risk"],
                "coverage_risk": pred["coverage_risk"],
                "claim_history_risk": pred["claim_history_risk"],
                "property_condition_risk": pred["property_condition_risk"],
                "broker_performance": pred["broker_performance"],
                "property_state": pred["property_state"],
                "occupancy_type": pred["occupancy_type"],
                "cover_type": pred["cover_type"],
                "submission_channel": pred["submission_channel"],
                "shap_values": json.loads(row["shap_values"]) if row["shap_values"] else MOCK_SHAP_VALUES,
                "vulnerability_data": json.loads(row["vulnerability_data"]) if row["vulnerability_data"] else MOCK_VULNERABILITY[i],
            })

        # Compute score and save to DB
        points = _compute_score(results)
        score_pct = round((points / 6.0) * 100, 1)
        cursor.execute(
            "UPDATE submissions SET score = ? WHERE id = ?",
            (score_pct, submission_id)
        )
        conn.commit()

        return {
            "submission_id": submission_id,
            "underwriter_name": submission["underwriter_name"],
            "score_percentage": score_pct,
            "results": results,
            "global_shap": MOCK_SHAP_VALUES,
        }
    finally:
        conn.close()
