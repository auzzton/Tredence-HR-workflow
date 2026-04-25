from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Liveness check. Returns 200 when the process is up.

    Step 3 will add a real SELECT 1 against the database and return
    {"status": "ok", "database": "ok"} or 503 when the DB is unreachable.
    """
    return {"status": "ok"}
