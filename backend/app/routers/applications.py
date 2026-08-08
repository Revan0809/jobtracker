import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationRead, ApplicationUpdate

router = APIRouter(prefix="/applications", tags=["applications"])


def _get_owned_application(db: Session, user: User, application_id: uuid.UUID) -> Application:
    application = db.get(Application, application_id)
    if application is None or application.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application


@router.get("", response_model=list[ApplicationRead])
def list_applications(
    company: str | None = Query(default=None, description="Case-insensitive substring match"),
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    date_from: date | None = Query(default=None, description="applied_date >= this date"),
    date_to: date | None = Query(default=None, description="applied_date <= this date"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Application).filter(Application.user_id == current_user.id)

    if company:
        query = query.filter(Application.company.ilike(f"%{company}%"))
    if status_filter:
        query = query.filter(Application.status == status_filter)
    if date_from:
        query = query.filter(Application.applied_date >= date_from)
    if date_to:
        query = query.filter(Application.applied_date <= date_to)

    query = query.order_by(Application.created_at.desc()).offset(offset).limit(limit)
    return query.all()


@router.get("/reminders", response_model=list[ApplicationRead])
def list_reminders(
    within_days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Applications with a deadline or follow-up date within the given window (including overdue)."""
    horizon = date.today() + timedelta(days=within_days)
    query = (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .filter(
            or_(
                Application.deadline.isnot(None) & (Application.deadline <= horizon),
                Application.follow_up_date.isnot(None) & (Application.follow_up_date <= horizon),
            )
        )
        .order_by(Application.deadline.asc().nulls_last(), Application.follow_up_date.asc().nulls_last())
    )
    return query.all()


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = Application(**payload.model_dump(), user_id=current_user.id)
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/{application_id}", response_model=ApplicationRead)
def get_application(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_application(db, current_user, application_id)


@router.patch("/{application_id}", response_model=ApplicationRead)
def update_application(
    application_id: uuid.UUID,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = _get_owned_application(db, current_user, application_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(application, field, value)
    db.commit()
    db.refresh(application)
    return application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = _get_owned_application(db, current_user, application_id)
    db.delete(application)
    db.commit()
