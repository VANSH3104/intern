from pydantic import BaseModel
from datetime import datetime

class ChallengeCreate(BaseModel):
    title: str
    description: str
    difficulty: str
    points: int
    expected_output: str

class ChallengeResponse(ChallengeCreate):
    id: int
    class Config:
        orm_mode = True

class SubmissionCreate(BaseModel):
    user_id: int
    challenge_id: int
    submitted_output: str

class SubmissionResponse(SubmissionCreate):
    id: int
    status: str
    timestamp: datetime
    class Config:
        orm_mode = True

class LeaderboardResponse(BaseModel):
    user_id: int
    score: int
    username: str
    last_submission_time: datetime
    class Config:
        orm_mode = True