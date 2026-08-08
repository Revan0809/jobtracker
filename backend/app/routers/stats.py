from collections import Counter
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.user import User
from app.schemas.stats import StatsOverview, StatusBreakdown, TimeSeriesPoint

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/overview", response_model=StatsOverview)
def stats_overview(
    days: int = Query(default=90, ge=1, le=730, description="Window for the time-series chart"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    applications = db.query(Application).filter(Application.user_id == current_user.id).all()

    counts = Counter(app.status for app in applications)
    total = len(applications)

    # Interview/offer rate are computed against total applications, not against
    # each other, so they read as "% of everything I applied to" — the framing
    # most people mean by these terms on a job-search dashboard.
    interview_rate = 0.0
    offer_rate = 0.0
    if total > 0:
        advanced_to_interview = (
            counts[ApplicationStatus.INTERVIEW] + counts[ApplicationStatus.OFFER]
        )
        interview_rate = round(advanced_to_interview / total * 100, 1)
        offer_rate = round(counts[ApplicationStatus.OFFER] / total * 100, 1)

    window_start = date.today() - timedelta(days=days)
    by_day: Counter[date] = Counter()
    for app in applications:
        applied = app.applied_date or app.created_at.date()
        if applied >= window_start:
            by_day[applied] += 1

    time_series = [
        TimeSeriesPoint(date=day.isoformat(), count=count)
        for day, count in sorted(by_day.items())
    ]

    return StatsOverview(
        total_applications=total,
        status_breakdown=StatusBreakdown(
            applied=counts[ApplicationStatus.APPLIED],
            interview=counts[ApplicationStatus.INTERVIEW],
            offer=counts[ApplicationStatus.OFFER],
            rejected=counts[ApplicationStatus.REJECTED],
        ),
        interview_rate=interview_rate,
        offer_rate=offer_rate,
        applications_over_time=time_series,
    )
