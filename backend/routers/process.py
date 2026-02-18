import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_connection
from ml.mock_runner import run_ml_pipeline

router = APIRouter()


class ProcessPayload(BaseModel):
    submissionId: int


@router.post("")
def trigger_process(payload: ProcessPayload):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        # Verify submission exists
        cursor.execute("SELECT * FROM submissions WHERE id = ?", (payload.submissionId,))
        submission = cursor.fetchone()
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

        # Delete any previous results for this submission
        cursor.execute(
            "DELETE FROM process_results WHERE submission_id = ?",
            (payload.submissionId,)
        )

        # Run ML pipeline for all 6 properties
        property_ids = [1, 2, 3, 4, 5, 6]
        results = run_ml_pipeline(property_ids)

        # Persist results
        for result in results:
            cursor.execute(
                """
                INSERT INTO process_results
                    (submission_id, property_id, ai_risk, quote_propensity,
                     total_risk_score, shap_values, vulnerability_data)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload.submissionId,
                    result["property_id"],
                    result["ai_risk"],
                    result["quote_propensity"],
                    result["total_risk_score"],
                    result["shap_values"],
                    result["vulnerability_data"],
                ),
            )

        conn.commit()
        return {"processId": payload.submissionId, "status": "completed", "count": len(results)}
    finally:
        conn.close()
