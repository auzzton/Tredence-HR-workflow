import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health
from app.config import get_settings
from app.core.exceptions import (
    DatabaseError,
    GraphValidationError,
    WorkflowNotFoundError,
    database_error_handler,
    graph_validation_handler,
    workflow_not_found_handler,
)
from app.core.logging import configure_logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    configure_logging(settings.log_level)
    logger.info("Starting up", extra={"env": settings.env})
    yield
    logger.info("Shutting down")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="HR Workflow Designer API",
        description="Backend for the Tredence HR Workflow Designer case study",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handlers — type: ignore because Starlette's overload requires
    # Callable[[Request, Exception], ...] but our handlers narrow exc internally.
    app.add_exception_handler(WorkflowNotFoundError, workflow_not_found_handler)  # type: ignore[arg-type]
    app.add_exception_handler(GraphValidationError, graph_validation_handler)  # type: ignore[arg-type]
    app.add_exception_handler(DatabaseError, database_error_handler)  # type: ignore[arg-type]

    app.include_router(health.router, tags=["health"])
    # Remaining routers added in later steps:
    #   workflows.router  — Step 5
    #   automations.router — Step 6
    #   simulate.router   — Step 8

    return app


app = create_app()
