import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine

def _get_db_dir() -> str:
    """Return the directory where gallery.db should be stored.
    - PyInstaller bundle (frozen exe): next to the .exe file
    - Development: project root (one level above the backend/ package)
    """
    if getattr(sys, 'frozen', False):
        # PyInstaller sets sys.frozen = True; sys.executable = path to .exe
        return os.path.dirname(sys.executable)
    # Development: __file__ is backend/database.py → go up one dir → project root
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_DB_PATH = os.path.join(_get_db_dir(), "gallery.db")

DATABASE_URL = f"sqlite+aiosqlite:///{_DB_PATH}"
SYNC_DATABASE_URL = f"sqlite:///{_DB_PATH}"

engine = create_async_engine(DATABASE_URL, echo=False)
sync_engine = create_engine(SYNC_DATABASE_URL, echo=False)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
SessionLocal = sessionmaker(bind=sync_engine, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

