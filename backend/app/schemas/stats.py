from pydantic import BaseModel


class StatusBreakdown(BaseModel):
    applied: int
    interview: int
    offer: int
    rejected: int


class TimeSeriesPoint(BaseModel):
    date: str
    count: int


class StatsOverview(BaseModel):
    total_applications: int
    status_breakdown: StatusBreakdown
    interview_rate: float
    offer_rate: float
    applications_over_time: list[TimeSeriesPoint]
