"""
SQLAlchemy ORM models for the prediction_history table.
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.database import Base


class PredictionHistory(Base):
    """Stores every prediction made through the /predict endpoint."""

    __tablename__ = "prediction_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    prediction: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<PredictionHistory(id={self.id}, patient={self.patient_name}, "
            f"prediction={self.prediction}, confidence={self.confidence:.2f})>"
        )
