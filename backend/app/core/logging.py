import logging
import sys

from pythonjsonlogger import jsonlogger  # type: ignore[import-untyped]


def configure_logging(level: str = "INFO") -> None:
    """Configure structured JSON logging for the entire application."""
    handler = logging.StreamHandler(sys.stdout)
    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level.upper())
