from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Base, engine
from model import Challenge, Submission, Leaderboard
from schema import ChallengeCreate, ChallengeResponse, SubmissionCreate, SubmissionResponse, LeaderboardResponse
from datetime import datetime

app = FastAPI()

# Ensure tables are created
Base.metadata.create_all(bind=engine)

@app.post("/challenges/", response_model=ChallengeResponse)
def create_challenge(challenge: ChallengeCreate, db: Session = Depends(get_db)):
    new_challenge = Challenge(**challenge.dict())
    db.add(new_challenge)
    db.commit()
    db.refresh(new_challenge)
    return new_challenge

@app.get("/challenges/", response_model=list[ChallengeResponse])
def get_challenges(db: Session = Depends(get_db)):
    return db.query(Challenge).all()

@app.post("/submissions/")
def submit_output(submission: SubmissionCreate, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.id == submission.challenge_id).first()
    
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Check if output matches expected output
    status = "Accepted" if submission.submitted_output == challenge.expected_output else "Wrong Answer"

    # Store submission
    new_submission = Submission(
        user_id=submission.user_id,
        challenge_id=submission.challenge_id,
        submitted_output=submission.submitted_output,
        status=status,
        timestamp=datetime.utcnow()
    )
    
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)

    # Update leaderboard if accepted
    if status == "Accepted":
        leaderboard_entry = db.query(Leaderboard).filter(
            Leaderboard.user_id == submission.user_id,
            Leaderboard.challenge_id == submission.challenge_id
        ).first()

        if leaderboard_entry:
            leaderboard_entry.score += challenge.points
            leaderboard_entry.last_submission_time = datetime.utcnow()
        else:
            leaderboard_entry = Leaderboard(
                user_id=submission.user_id,
                challenge_id=submission.challenge_id,
                score=challenge.points,
                last_submission_time=datetime.utcnow()
            )
            db.add(leaderboard_entry)

        db.commit()

    return {"proceed": "yes" if status == "Accepted" else "no"}

@app.get("/submissions/{user_id}", response_model=list[SubmissionResponse])
def get_submission_history(user_id: int, db: Session = Depends(get_db)):
    return db.query(Submission).filter(Submission.user_id == user_id).all()

@app.get("/leaderboard/{challenge_id}", response_model=list[LeaderboardResponse])
def get_leaderboard(challenge_id: int, db: Session = Depends(get_db)):
    leaderboard = db.query(Leaderboard).filter(
        Leaderboard.challenge_id == challenge_id
    ).order_by(
        Leaderboard.score.desc(),
        Leaderboard.last_submission_time.desc()
    ).all()
    
    return [
    {
        "user_id": entry.user_id,
        "username": entry.user.username,
        "score": entry.score,
        "last_submission_time": entry.last_submission_time
    }
    for entry in leaderboard]