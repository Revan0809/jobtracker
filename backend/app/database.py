from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

# SQLite is not a supported deployment target (see SCHEMA.md), but allowing it
# here means the app can be poked at locally without Docker/Postgres installed.
# check_same_thread=False is required because FastAPI runs sync path operations
# in a threadpool, and SQLite otherwise rejects cross-thread connection use.
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
