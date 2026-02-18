import json
from fastapi import APIRouter, HTTPException
from database import get_connection

router = APIRouter()


@router.get("/{submission_id}")
def get_results(submission_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        # Verify submission exists
        cursor.execute("SELECT * FROM submissions WHERE id = ?", (submission_id,))
        submission = cursor.fetchone()
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

        prioritized_ids = json.loads(submission["prioritized_ids"])
        discarded_ids = json.loads(submission["discarded_ids"])

        # Fetch per-property results
        cursor.execute(
            "SELECT * FROM process_results WHERE submission_id = ? ORDER BY property_id",
            (submission_id,)
        )
        rows = cursor.fetchall()

        results = []
        for row in rows:
            pid = row["property_id"]
            user_selection = None
            if pid in prioritized_ids:
                user_selection = "prioritized"
            elif pid in discarded_ids:
                user_selection = "discarded"

            results.append({
                "property_id": pid,
                "user_selection": user_selection,
                "ai_risk": row["ai_risk"],
                "quote_propensity": row["quote_propensity"],
                "total_risk_score": row["total_risk_score"],
                "shap_values": json.loads(row["shap_values"]) if row["shap_values"] else [],
                "vulnerability_data": json.loads(row["vulnerability_data"]) if row["vulnerability_data"] else {},
            })

        return {
            "submission_id": submission_id,
            "underwriter_name": submission["underwriter_name"],
            "results": results,
        }
    finally:
        conn.close()
