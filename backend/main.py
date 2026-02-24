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
from topics.topic_extraction import assign_topic
from sentiment_analysis.classify_emotions import classify_emotions


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

    text = extract_text_from_pdf(file_path)
    assign_topic(db, firebase_uid, document.id)

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

@app.delete("/documents/{document_id}")
def delete_doc(
    document_id: int, 
    direbase_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    firebase_uid = direbase_user["uid"]
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == firebase_uid
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.query(models.DocumentTopic).filter(
        models.DocumentTopic.document_id == document.id
    ).delete(synchronize_session=False)

    all_topics = db.query(models.Topic).all()
    for topic in all_topics:
        count = db.query(models.DocumentTopic).filter(models.DocumentTopic.topic_id == topic.id).count()
        if count == 0:
            db.delete(topic)

    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    db.delete(document)
    db.commit()

    return {"message": f"Document {document.title} deleted successfully"}


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

@app.get("/topics/{topic_id}/summary")
def collective_summary(topic_id: int, firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    firebase_uid = firebase_user["uid"]
    full_text = ""
    topic = db.query(models.Topic).filter(
        models.Topic.id == topic_id,
        models.Topic.user_id == firebase_uid
    ).first()
    document_ids = []
    for dt in topic.documents:
        if dt.document is not None:
            document_ids.append(dt.document.id)
    for id in document_ids:
        doc = db.query(models.Document).filter(
            models.Document.id == id,
            models.Document.user_id == firebase_uid
        ).first()
        full_text += extract_text_from_pdf(doc.file_path)
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

@app.put("/topics/{topic_id}/summary")
def save_summary(
    topic_id: int,
    summary: SummarySaveRequest,
    firebase_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    firebase_uid = firebase_user["uid"]

    topic = db.query(models.Topic).filter(
        models.Topic.id == topic_id,
        models.Topic.user_id == firebase_uid
    ).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Document not found")

    topic.summary = summary.summary
    db.commit()
    db.refresh(topic)

    return {"message": "Summary saved"}


from sqlalchemy.orm import joinedload

@app.get("/topics")
def get_topics(firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = firebase_user["uid"]

    topics = db.query(models.Topic)\
        .options(joinedload(models.Topic.documents).joinedload(models.DocumentTopic.document))\
        .filter(models.Topic.user_id == user_id)\
        .all()
    results = []
    for topic in topics:
        docs = []
        for dt in topic.documents:
            docs.append({
                "id": dt.document.id,
                "title": dt.document.title,
                "file_path": dt.document.file_path,
                "summary": dt.document.summary or None
                
            })
        results.append({
            "id": topic.id,
            "name": topic.name,
            "documents": docs
        })
        

    return results

@app.get('/journal/entries')
def get_entries(firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = firebase_user['uid']
    entries = db.query(models.JournalEntry)\
        .filter(models.JournalEntry.user_id == user_id)\
        .all()
    
    return {"entries": entries}


from textblob import TextBlob

class EntryContentModel(BaseModel):
    content: str

@app.put('/journal/entries')
def save_entry(entry: EntryContentModel, firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = firebase_user['uid']

    positive_emotions = ["admiration", "amusement", "approval", "caring", "excitement", "gratitude", "joy", "love", "optimism", "pride", "realization", "relief"]
    negative_emotions = ["anger", "annoyance", "confusion", "curiosity", "desire", "disappointment", "disapproval", "disgust", "embarrassment", "fear", "grief", "nervousness", "remorse", "sadness", "surprise"]

    analysis = classify_emotions(entry.content)
    top_emotion = analysis["top_emotion"]
    sentiment_score = analysis["sentiment_score"]
    positive_score = 0
    negative_score = 0

    all_emotions = analysis["all_emotions"]
    positive_score = sum(all_emotions[e] for e in positive_emotions if e in all_emotions)
    negative_score = sum(all_emotions[e] for e in negative_emotions if e in all_emotions)

    if positive_score > negative_score:
        sentiment_polarity = 1
    elif negative_score > positive_score:
        sentiment_polarity = -1
    else:
        sentiment_polarity = 0

    print("positive score:", positive_score)
    print("negative score:", negative_score)
    print("sentiment polarity:", sentiment_polarity)


    new_entry = models.JournalEntry(
        user_id=user_id,
        content=entry.content,
        top_emotion=top_emotion,
        sentiment_score=sentiment_score,
        sentiment_polarity=sentiment_polarity
    )

    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)

    return new_entry


@app.get("/sentiment/analytics")
def get_analytics(firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = firebase_user['uid']
    entries = db.query(models.JournalEntry)\
        .filter(models.JournalEntry.user_id == user_id)\
        .order_by(models.JournalEntry.created_at.asc())\
        .all()

    data = [
        {
            "date": entry.created_at.strftime("%Y-%m-%d"),
            "sentiment_polarity": entry.sentiment_polarity
        }
        for entry in entries
    ]

    return data
