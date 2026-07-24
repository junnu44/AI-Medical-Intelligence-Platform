"""
Structured logging configuration.

Provides a pre-configured logger with console output and structured
formatting for API requests, prediction timing, model loading, and errors.
"""

import logging
import sys
from pathlib import Path


def setup_logger(name: str = "medical_ai", level: int = logging.INFO) -> logging.Logger:
    """
    Create and configure a structured logger.

    Args:
        name: Logger name identifier.
        level: Logging level (default: INFO).

    Returns:
        Configured logging.Logger instance.
    """
    logger = logging.getLogger(name)

    # Prevent duplicate handlers when called multiple times
    if logger.handlers:
        return logger

    logger.setLevel(level)

    # ── Console Handler ──────────────────────────────────────────────
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # ── File Handler (optional, writes to logs/ if writable) ─────────
    try:
        log_dir = Path(__file__).resolve().parent.parent.parent / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_dir / "app.log", encoding="utf-8")
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except OSError:
        logger.warning("Could not create file log handler; logging to console only.")

    return logger


# Module-level logger ready for import
logger = setup_logger()
