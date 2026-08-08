import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.models.application import ApplicationStatus


def _validate_job_link(v: str | None) -> str | None:
    if v is None or v == "":
        return None
    # Validate shape via Pydantic's URL parser, but persist as plain str so the
    # DB column and API contract don't have to special-case a URL type.
    HttpUrl(v)
    return v


class ApplicationBase(BaseModel):
    company: str = Field(min_length=1, max_length=255)
    role: str = Field(min_length=1, max_length=255)
    status: ApplicationStatus = ApplicationStatus.APPLIED
    applied_date: date | None = None
    deadline: date | None = None
    follow_up_date: date | None = None
    notes: str | None = Field(default=None, max_length=10_000)
    job_link: str | None = Field(default=None, max_length=2048)

    _validate_job_link = field_validator("job_link")(_validate_job_link)


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=255)
    role: str | None = Field(default=None, min_length=1, max_length=255)
    status: ApplicationStatus | None = None
    applied_date: date | None = None
    deadline: date | None = None
    follow_up_date: date | None = None
    notes: str | None = Field(default=None, max_length=10_000)
    job_link: str | None = Field(default=None, max_length=2048)

    _validate_job_link = field_validator("job_link")(_validate_job_link)


class ApplicationRead(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
