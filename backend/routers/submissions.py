import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import get_connection

router = APIRouter()


class SubmissionPayload(BaseModel):
    underwriter_name: str
    prioritized_ids: List[str]
    discarded_ids: List[str]


@router.post("")
def create_submission(payload: SubmissionPayload):
    # Validate no overlap between prioritized and discarded
    overlap = set(payload.prioritized_ids) & set(payload.discarded_ids)
    if overlap:
        raise HTTPException(
            status_code=400,
            detail=f"Property IDs cannot be both prioritized and discarded: {list(overlap)}"
        )

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO submissions (underwriter_name, prioritized_ids, discarded_ids)
            VALUES (?, ?, ?)
            """,
            (
                payload.underwriter_name,
                json.dumps(payload.prioritized_ids),
                json.dumps(payload.discarded_ids),
            ),
        )
        conn.commit()
        submission_id = cursor.lastrowid
        return {
            "id": submission_id,
            "underwriter_name": payload.underwriter_name,
            "prioritized_ids": payload.prioritized_ids,
            "discarded_ids": payload.discarded_ids,
            "created_at": None,  # populated on next fetch
        }
    finally:
        conn.close()


@router.get("/latest")
def get_latest_submission():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM submissions ORDER BY created_at DESC LIMIT 1"
        )
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "underwriter_name": row["underwriter_name"],
            "prioritized_ids": json.loads(row["prioritized_ids"]),
            "discarded_ids": json.loads(row["discarded_ids"]),
            "created_at": row["created_at"],
        }
    finally:
        conn.close()


@router.get("/{submission_id}")
def get_submission(submission_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM submissions WHERE id = ?", (submission_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Submission not found")
        return {
            "id": row["id"],
            "underwriter_name": row["underwriter_name"],
            "prioritized_ids": json.loads(row["prioritized_ids"]),
            "discarded_ids": json.loads(row["discarded_ids"]),
            "created_at": row["created_at"],
        }
    finally:
        conn.close()
