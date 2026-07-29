"""
Gemini LLM service for AI-generated medical reports.

Integrates with Google's Gemini 2.5 Flash model to produce
structured medical reports based on prediction results. Designed
for graceful degradation — if the API fails for any reason, the
prediction pipeline continues without a report.
"""

import time
from typing import Optional

import google.generativeai as genai

from backend.app.core.config import settings
from backend.app.core.logger import logger
from backend.app.llm.prompts import build_medical_report_prompt


class GeminiService:
    """
    Manages Gemini API interactions for medical report generation.

    Attributes:
        model: Configured Gemini GenerativeModel instance.
        is_available: Whether the service has a valid API key.
    """

    def __init__(self) -> None:
        self.model = None
        self.is_available: bool = False
        self._configure()

    def _configure(self) -> None:
        """
        Configure the Gemini client with the API key from settings.

        If no API key is provided, the service marks itself as
        unavailable and logs a warning. The prediction pipeline
        will skip report generation gracefully.
        """
        api_key = settings.GEMINI_API_KEY.strip()

        if not api_key:
            logger.warning(
                "GEMINI_API_KEY is not set — AI report generation will be skipped."
            )
            return

        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.5-flash")
            self.is_available = True
            logger.info(
                "GeminiService configured (model=gemini-2.5-flash, key=***%s)",
                api_key[-4:] if len(api_key) >= 4 else "****",
            )
        except Exception as exc:
            logger.error("Failed to configure Gemini client: %s", exc, exc_info=True)
            self.is_available = False

    def generate_report(
        self,
        prediction: str,
        confidence: float,
        patient_name: str,
        age: int,
        gender: str,
    ) -> Optional[str]:
        """
        Generate a structured medical report using Gemini.

        This method is designed to **never** raise exceptions to the
        caller. All errors are caught, logged, and ``None`` is returned
        to allow the prediction pipeline to continue.

        Args:
            prediction: Model prediction label (e.g. ``"PNEUMONIA"``).
            confidence: Confidence percentage (0–100).
            patient_name: Patient full name.
            age: Patient age in years.
            gender: Patient gender string.

        Returns:
            The generated report text, or ``None`` if generation fails
            or the service is unavailable.
        """
        if not self.is_available or self.model is None:
            logger.warning(
                "Gemini service unavailable — skipping report generation."
            )
            return None

        start = time.perf_counter()

        try:
            prompt = build_medical_report_prompt(
                prediction=prediction,
                confidence=confidence,
                patient_name=patient_name,
                age=age,
                gender=gender,
            )

            logger.info(
                "Sending prompt to Gemini (prediction=%s, confidence=%.2f%%)",
                prediction,
                confidence,
            )

            response = self.model.generate_content(prompt)

            elapsed = time.perf_counter() - start

            if response and response.text:
                # Log token usage if available
                if hasattr(response, "usage_metadata") and response.usage_metadata:
                    metadata = response.usage_metadata
                    logger.info(
                        "Gemini response received in %.3fs "
                        "(prompt_tokens=%s, candidates_tokens=%s, total_tokens=%s)",
                        elapsed,
                        getattr(metadata, "prompt_token_count", "N/A"),
                        getattr(metadata, "candidates_token_count", "N/A"),
                        getattr(metadata, "total_token_count", "N/A"),
                    )
                else:
                    logger.info(
                        "Gemini response received in %.3fs (token info unavailable)",
                        elapsed,
                    )

                return response.text

            logger.warning(
                "Gemini returned empty response after %.3fs", elapsed
            )
            return None

        except Exception as exc:
            elapsed = time.perf_counter() - start
            logger.error(
                "Gemini report generation failed after %.3fs: %s",
                elapsed,
                exc,
                exc_info=True,
            )
            return None


# Singleton instance
gemini_service = GeminiService()
