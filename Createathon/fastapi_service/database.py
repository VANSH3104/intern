from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# PostgreSQL Database URL
DATABASE_URL = "postgresql://neondb_owner:npg_tvA5igb1lsKr@ep-misty-morning-a8bheicc-pooler.eastus2.azure.neon.tech/neondb"

# Create engine
engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
