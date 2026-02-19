from fastapi import APIRouter
from database import get_connection

router = APIRouter()


@router.get("")
def get_leaderboard():
    """Return top 10 submissions ranked by score percentage."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, underwriter_name, score, created_at "
            "FROM submissions "
            "WHERE score IS NOT NULL "
            "ORDER BY score DESC, created_at ASC "
            "LIMIT 10"
        )
        rows = cursor.fetchall()
        entries = []
        for i, row in enumerate(rows):
            entries.append({
                "rank": i + 1,
                "submission_id": row["id"],
                "underwriter_name": row["underwriter_name"],
                "score_percentage": round(row["score"], 1),
                "created_at": row["created_at"],
            })
        return entries
    finally:
        conn.close()
