from fastapi import Request
from fastapi.responses import JSONResponse


class WorkflowNotFoundError(Exception):
    def __init__(self, workflow_id: str) -> None:
        self.workflow_id = workflow_id
        super().__init__(f"Workflow '{workflow_id}' not found")


class GraphValidationError(Exception):
    def __init__(self, errors: list[str]) -> None:
        self.errors = errors
        super().__init__("; ".join(errors))


class DatabaseError(Exception):
    pass


# ---------------------------------------------------------------------------
# FastAPI exception handlers
# Handlers accept `Exception` (Starlette's required signature); the registered
# exc_class ensures the handler only fires for the right type.
# ---------------------------------------------------------------------------


async def workflow_not_found_handler(
    _request: Request, exc: Exception
) -> JSONResponse:
    """Map WorkflowNotFoundError → 404 JSON."""
    return JSONResponse(
        status_code=404,
        content={"error": {"code": "WORKFLOW_NOT_FOUND", "message": str(exc)}},
    )


async def graph_validation_handler(
    _request: Request, exc: Exception
) -> JSONResponse:
    """Map GraphValidationError → 422 JSON with individual error list."""
    errors: list[str] = exc.errors if isinstance(exc, GraphValidationError) else []
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "GRAPH_VALIDATION_ERROR",
                "message": str(exc),
                "errors": errors,
            }
        },
    )


async def database_error_handler(
    _request: Request, _exc: Exception
) -> JSONResponse:
    """Map DatabaseError → 503 JSON."""
    return JSONResponse(
        status_code=503,
        content={"error": {"code": "DATABASE_ERROR", "message": "Database unavailable"}},
    )
