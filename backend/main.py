from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, APIRouter, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import shutil
from database import engine, Base
import models
from database import get_db
from auth import get_current_user
from datetime import timedelta, datetime
import firebase_admin
from firebase_admin import auth as firebase_auth
from fastapi.responses import FileResponse
from summarization.text_extraction import extract_text_from_pdf
from summarization.summarization import chunk_text, summarize_chunk

Base.metadata.create_all(bind=engine)

app = FastAPI()

router = APIRouter()

@router.post("/auth/firebase")
def firebase_login(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    try:
        token = authorization.replace("Bearer ", "")
        decoded = firebase_auth.verify_id_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

    firebase_uid = decoded["uid"]
    email = decoded.get("email")

    user = db.query(models.User).filter(
        models.User.firebase_uid == firebase_uid
    ).first()

    if not user:
        user = models.User(
            firebase_uid=firebase_uid,
            email=email
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {"message": "User synced", "user_id": user.id}

# add CORS middleware to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# save uploaded files to uploads directory
UPLOAD_DIR = "uploads"
# since the uploads directory is in the .gitignore, ensure it exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@app.post("/upload")
def upload_file(
    file: UploadFile,
    firebase_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    firebase_uid = firebase_user["uid"]

    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()

    if not user:
        user = models.User(
            firebase_uid=firebase_uid,
            email=firebase_user.get("email"),
            name=firebase_user.get("email", "").split('@')[0] if firebase_user.get("email") else "New User"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    document = models.Document(
        user_id=user.firebase_uid,
        title=file.filename,
        file_path=file_path
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return {"message": "File uploaded"}

@app.get("/documents")
def get_documents(
    firebase_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    firebase_uid = firebase_user["uid"]

    user = db.query(models.User).filter(
        models.User.firebase_uid == firebase_uid
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return db.query(models.Document).filter(
        models.Document.user_id == user.firebase_uid
    ).all()

@app.get("/documents/{document_id}")
def get_document(
    document_id: int,
    firebase_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    firebase_uid = firebase_user["uid"]

    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == firebase_uid
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return FileResponse(document.file_path, media_type="application/pdf")

# @app.delete("/documents/{document_id}")

@app.get("/documents/{document_id}/summary")
def summarize_pdf(document_id: int, firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    firebase_uid = firebase_user["uid"]

    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == firebase_uid
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    full_text = extract_text_from_pdf(document.file_path)
    chunks = chunk_text(full_text)

    summaries = []
    for i, c in enumerate(chunks):
        summaries.append(summarize_chunk(c))

    return {"summary": " ".join(summaries)}


from pydantic import BaseModel

class SummarySaveRequest(BaseModel):
    summary: str

@app.put("/documents/{document_id}/summary")
def save_summary(
    document_id: int,
    summary: SummarySaveRequest,
    firebase_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    firebase_uid = firebase_user["uid"]

    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == firebase_uid
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    document.summary = summary.summary
    db.commit()
    db.refresh(document)

    return {"message": "Summary saved"}
