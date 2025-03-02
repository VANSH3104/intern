from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from database import Base

class DjangoUser(Base):
    __tablename__ = "authentication_customuser"  # Django's default table for users

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)

    # Relationships
    submissions = relationship("Submission", back_populates="user")
    leaderboard_entries = relationship("Leaderboard", back_populates="user")

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    points = Column(Integer, nullable=False)
    expected_output = Column(String, nullable=False)

    # Relationship
    submissions = relationship("Submission", back_populates="challenge")
    leaderboard_entries = relationship("Leaderboard", back_populates="challenge")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("authentication_customuser.id"), nullable=False)  # Link to Django users
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    submitted_output = Column(String, nullable=False)
    status = Column(String, nullable=False)
    timestamp = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("DjangoUser", back_populates="submissions")
    challenge = relationship("Challenge", back_populates="submissions")

class Leaderboard(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("authentication_customuser.id"), nullable=False)  # Link to Django users
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    score = Column(Integer, nullable=False, default=0)
    last_submission_time = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("DjangoUser", back_populates="leaderboard_entries")
    challenge = relationship("Challenge", back_populates="leaderboard_entries")
