import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_returns_200(client: AsyncClient) -> None:
    """Health endpoint must return HTTP 200 with status ok."""
    # Implemented in Step 3 (DB check wired); basic shape tested now.
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
