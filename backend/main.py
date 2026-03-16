from unittest import result
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
from topics.topic_extraction import assign_topic
from sentiment_analysis.classify_emotions import classify_emotions
from fastapi.responses import StreamingResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import io
import markdown2
from weasyprint import HTML


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

import subprocess
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
    prompt = f""" Write a detailed summary of the following document. 
    Cover all major concepts, arguments, and technical details.
    Write in formal academic tone. Only return the summary, add no messages or prompts.
    Document:\n\n{full_text}"""

    try:
        result = subprocess.run(
                ["ollama", "run", "gemma3:1b", prompt],
                capture_output=True,
                text=True,
                timeout=500  # prevent infinite freeze
            )        

        return {"summary": result.stdout.strip()}
    except:
        return {"summary": "Error generating summary. Please try again."}


def chunk_summaries(summaries, chunk_size=4):
    for i in range(0, len(summaries), chunk_size):
        yield summaries[i:i + chunk_size]

@app.get("/topics/{topic_id}/summary")
def collective_summary(topic_id: int, firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    firebase_uid = firebase_user["uid"]
    topic = db.query(models.Topic).filter(
        models.Topic.id == topic_id,
        models.Topic.user_id == firebase_uid
    ).first()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    document_ids = [dt.document.id for dt in topic.documents if dt.document is not None]

    overall_summary = ""

    individual_prompt = """Write a detailed summary of the following text.
    Cover all major concepts, arguments, and technical details.
    Write in formal academic tone. Only return the summary, add no messages or prompts.\n\n"""

    summaries = []
    for doc_id in document_ids:
        doc = db.query(models.Document).filter(
            models.Document.id == doc_id,
            models.Document.user_id == firebase_uid
        ).first()

        if doc is None:
            continue

        if doc.summary is not None:
            summaries.append(doc.summary)
        else:
            try:
                result = subprocess.run(
                    ["ollama", "run", "gemma3:1b", individual_prompt + extract_text_from_pdf(doc.file_path)],
                    capture_output=True, text=True, timeout=500
                )
                summaries.append(result.stdout.strip())
            except Exception as e:
                summaries.append("Error generating this summary.")

    # Chunk and synthesize
    combined = ""
    for chunk in chunk_summaries(summaries):
        combined = "\n\n".join(chunk)
        synthesis_prompt = f"""You are synthesizing summaries of documents within the same topic.
        Only return the summary, add no messages or prompts.
        Summaries:
        {combined}
        """
        try:
            result = subprocess.run(
                ["ollama", "run", "gemma3:1b", synthesis_prompt],
                capture_output=True, text=True, timeout=500
            )
            overall_summary += "\n\n" + result.stdout.strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error during synthesis: {str(e)}")

    return {"summary": overall_summary.strip()}
    

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

@app.get("/documents/{document_id}/summary/download")
async def download_summary_pdf(document_id: int, firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    firebase_uid = firebase_user["uid"]
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == firebase_uid
    ).first()
    if not doc or not doc.summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    
    html_content = markdown2.markdown(doc.summary)

    pdf_buffer = io.BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=summary_{document_id}.pdf"}
    )

@app.get("/topics/{topic_id}/summary/download")
async def download_summary_pdf(topic_id: int, firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    firebase_uid = firebase_user["uid"]
    topic = db.query(models.Topic).filter(
        models.Topic.id == topic_id,
        models.Topic.user_id == firebase_uid
    ).first()
    if not topic or not topic.summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    
    html_content = markdown2.markdown(topic.summary)

    pdf_buffer = io.BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=summary_{topic_id}.pdf"}
    )


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
            "documents": docs,
            "summary": topic.summary or None
        })
        

    return results

@app.get('/journal/entries')
def get_entries(firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = firebase_user['uid']
    entries = db.query(models.JournalEntry)\
        .filter(models.JournalEntry.user_id == user_id)\
        .all()
    
    return {"entries": entries}



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

    all_emotions = analysis["all_emotions"]
    positive_score = sum(all_emotions[e] for e in positive_emotions if e in all_emotions)
    negative_score = sum(all_emotions[e] for e in negative_emotions if e in all_emotions)

    sentiment_polarity = positive_score - negative_score

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

import json
import re
@app.get('/documents/{document_id}/mindmap')
def summarize_pdf(document_id: int, firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    firebase_uid = firebase_user["uid"]

    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == firebase_uid
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    full_text = extract_text_from_pdf(document.file_path)
    prompt = """
    You are generating data for a React mindmap visualization.

    Return ONLY valid JSON. Do NOT include explanations, markdown, or code fences.

    The JSON must follow EXACTLY this structure:

    {
    "name": "Main topic of the document",
    "children": [
        {
        "name": "Major topic",
        "children": [
            {
            "name": "Subtopic",
            "children": [{
                "name": "Sub-subtopic",
                "children": [{
                    "name": "Further detail"                
                }]}, 
                {
                    "name": "Another sub-subtopic"
                }]
            }
        ]
        }
    ]
    }

    Rules:
    - Only use the keys "name" and "children".
    - Every node MUST be an object.
    - "name" must be a short topic label (max 5 words).
    - "children" must be an array of objects.
    - The children array must NEVER contain strings.
    - If a node has no subtopics, return "children": [].
    - Do NOT include professor names, author names, or people as topics.
    - Extract meaningful academic concepts only.
    - Organize topics hierarchically from general to specific.
    - Do not create more than 6 top-level topics.
    - Each topic can have up to 6 children.

    If your output contains anything other than JSON, it is incorrect.

    Document:
    """ + full_text

    try:
        result = subprocess.run(
                ["ollama", "run", "gemma3:4b", prompt],
                capture_output=True,
                text=True,
                timeout=500
            ) 
        
        raw_output = result.stdout.strip()
        cleaned = re.sub(r"```json|```", "", raw_output).strip()
        print("Cleaned output from model:", cleaned)
        try:
            mindmap_json = json.loads(cleaned)
        except json.JSONDecodeError:
            return {"error": "Model did not return valid JSON"}

        return {"mindmap": mindmap_json}       

    except:
        return {"mindmap": "Error generating mindmap. Please try again."}
    

@app.put("/documents/{document_id}/mindmap")
def save_mindmap(
    document_id: int,
    mindmap: dict,
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

    document.mindmap = json.dumps(mindmap)
    db.commit()
    db.refresh(document)

    return {"message": "Mindmap saved"}


# @app.get("/topics/{topic_id}/mindmap")
# def generate_mindmap(topic_id: int, firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
#     firebase_uid = firebase_user["uid"]

#     topic = db.query(models.Topic).filter(
#         models.Topic.id == topic_id,
#         models.Topic.user_id == firebase_uid
#     ).first()
#     if not topic:
#         raise HTTPException(status_code=404, detail="Topic not found")

#     document_paths = [
#         dt.document.file_path
#         for dt in topic.documents
#         if dt.document is not None
#     ]

#     if not document_paths:
#         raise HTTPException(status_code=404, detail="No documents found for this topic")
    
#     mindmaps = []

#     for path in document_paths:
#         prompt = """
#             You are generating data for a React mindmap visualization.

#             Return ONLY valid JSON. Do NOT include explanations, markdown, or code fences.

#             The JSON must follow EXACTLY this structure:

#             {
#             "name": "Main topic of the document",
#             "children": [
#                 {
#                 "name": "Major topic",
#                 "children": [
#                     {
#                     "name": "Subtopic",
#                     "children": [{
#                         "name": "Sub-subtopic",
#                         "children": [{
#                             "name": "Further detail"                
#                         }]}, 
#                         {
#                             "name": "Another sub-subtopic"
#                         }]
#                     }
#                 ]
#                 }
#             ]
#             }

#             Rules:
#             - Only use the keys "name" and "children".
#             - Every node MUST be an object.
#             - "name" must be a short topic label (max 5 words).
#             - "children" must be an array of objects.
#             - The children array must NEVER contain strings.
#             - If a node has no subtopics, return "children": [].
#             - Do NOT include professor names, author names, or people as topics.
#             - Extract meaningful academic concepts only.
#             - Organize topics hierarchically from general to specific.
#             - Do not create more than 6 top-level topics.
#             - Each topic can have up to 6 children.

#             If your output contains anything other than JSON, it is incorrect.

#             Document:
#         """ + extract_text_from_pdf(path)

#         try:
#             result = subprocess.run(
#                 ["ollama", "run", "gemma3:4b", prompt],
#                 capture_output=True,
#                 text=True,
#                 timeout=500
#             )

#             raw_output = result.stdout.strip()
#             cleaned = re.sub(r"```json|```", "", raw_output).strip()            
#             mindmaps.append(cleaned)

#         except Exception as e:
#             print("Error generating mindmap for doc:", e)
#             continue
#     # Combine chunk mindmaps into one (simple approach: attach all as children of root)
#     prompt2 = """
#         You are merging multiple mindmap JSONs into one unified mindmap. Retun ONLY valid JSON. Do NOT include explanations, markdown, or code fences.
#         Each input JSON follows this structure:
#         {
#         "name": "Main topic",
#         "children": [
#             {
#             "name": "Subtopic",
#             "children": []
#             }
#         ]
#         }

#     """ + str(mindmaps)
    
#     final_mindmap = subprocess.run(
#         ["ollama", "run", "gemma3:4b", prompt2],
#         capture_output=True,
#         text=True,
#         timeout=500
#     )

#     final_mindmap_cleaned = re.sub(r"```json|```", "", final_mindmap.stdout.strip()).strip()

#     return {"mindmap": final_mindmap_cleaned}
def run_ollama_with_retry(prompt, model="gemma3:4b", retries=3, timeout=500):
    for attempt in range(retries):
        result = subprocess.run(
            ["ollama", "run", model, prompt],
            capture_output=True, text=True, timeout=timeout
        )
        raw = result.stdout.strip()
        cleaned = re.sub(r"```json|```", "", raw).strip()
        try:
            parsed = json.loads(cleaned)
            return parsed
        except json.JSONDecodeError:
            print(f"Attempt {attempt+1}: Invalid JSON, retrying...")
    return None

@app.get("/topics/{topic_id}/mindmap")
def generate_mindmap(topic_id: int, firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    firebase_uid = firebase_user["uid"]
    topic = db.query(models.Topic).filter(
        models.Topic.id == topic_id,
        models.Topic.user_id == firebase_uid
    ).first()

    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    documents = [dt.document for dt in topic.documents if dt.document is not None]

    if not documents:
        raise HTTPException(status_code=404, detail="No documents found for this topic")

    mindmap_prompt = lambda text: """
        You are generating data for a React mindmap visualization.
        Return ONLY valid JSON. Do NOT include explanations, markdown, or code fences.
        The JSON must follow EXACTLY this structure:
        {
            "name": "Main topic of the document",
            "children": [
                {
                    "name": "Major topic",
                    "children": [
                        { "name": "Subtopic", "children": [] }
                    ]
                }
            ]
        }
        Rules:
        - Only use the keys "name" and "children".
        - "name" must be a short topic label (max 5 words).
        - "children" must be an array of objects, never strings.
        - If a node has no subtopics, return "children": [].
        - Do NOT include professor names, author names, or people as topics.
        - Extract meaningful academic concepts only.
        - Organize topics hierarchically from general to specific.
        - Do not create more than 6 top-level topics.
        - Each topic can have up to 6 children.
        If your output contains anything other than JSON, it is incorrect.
        Document:
    """ + text

    children = []
    for doc in documents:
        # Check if mindmap already exists
        if doc.mindmap is not None:
            try:
                parsed = json.loads(doc.mindmap)
                children.append(parsed)
                continue
            except json.JSONDecodeError:
                pass

        # Generate from scratch
        parsed = run_ollama_with_retry(mindmap_prompt(extract_text_from_pdf(doc.file_path)))
        if parsed:
            children.append(parsed)
        else:
            print(f"Failed to generate mindmap for doc {doc.id} after retries")

    if not children:
        raise HTTPException(status_code=500, detail="Could not generate any mindmaps")

    # Build final structure in Python, no LLM needed for merging
    final_mindmap = {
        "name": topic.name,
        "children": children
    }

    return {"mindmap": final_mindmap}

@app.put("/topics/{topic_id}/mindmap")
def save_mindmap(
    topic_id: int,
    mindmap: dict,
    firebase_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    firebase_uid = firebase_user["uid"]

    topic = db.query(models.Topic).filter(
        models.Topic.id == topic_id,
        models.Topic.user_id == firebase_uid
    ).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic.mindmap = json.dumps(mindmap)
    db.commit()
    db.refresh(topic)

    return {"message": "Mindmap saved"}


@app.post('/document/{document_id}/tasks')
def get_tasks(document_id: int, firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    firebase_uid = firebase_user["uid"]

    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == firebase_uid
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    existing_tasks = db.query(models.DocumentTask).filter_by(document_id=document_id).all()
    if existing_tasks:
        # If tasks already exist, return them
        tasks_list = []
        for dt in existing_tasks:
            task = db.query(models.Task).filter(models.Task.id == dt.task_id).first()
            if task:
                tasks_list.append({
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "priority": task.priority,
                    "status": task.status,
                    "estimated_time": task.estimated_time
                })
        return {"BACKLOG": [t for t in tasks_list if t["status"] == "BACKLOG"],
            "IN PROGRESS": [t for t in tasks_list if t["status"] == "IN PROGRESS"],
            "REVISING": [t for t in tasks_list if t["status"] == "REVISING"],
            "DONE": [t for t in tasks_list if t["status"] == "DONE"],}
    
    prompt = """
        Generate a list of actionable study tasks based on this document that a user could follow to prepare for an exam. 
        Each task should have the following fields:
        - title: short descriptive name of the task
        - description: detailed explanation of what to do
        - priority: high, medium, or low
        - estimated_time: time to complete in minutes
        - status: initialize all of them to BACKLOG

        Return ONLY valid JSON in the following format:
        [
            {
                "title": "...",
                "description": "...",
                "priority": "...",
                "estimated_time": ...
                "status": "BACKLOG"
            }, {
                "title": "...",
                "description": "...",
                "priority": "...",
                "estimated_time": ...
                "status": "BACKLOG"
            }
        ]
        """ + extract_text_from_pdf(document.file_path)
    
    try:
        result = subprocess.run(
                ["ollama", "run", "gemma3:4b", prompt],
                capture_output=True,
                text=True,
                timeout=500
            )

        raw_output = result.stdout.strip()
        cleaned = re.sub(r"```json|```", "", raw_output).strip()
        tasks_json = json.loads(cleaned)
        print(tasks_json)
    
        topic_ids = [dt.topic_id for dt in document.topics]
        saved = []
        for t in tasks_json:
            task_obj = models.Task(
                user_id=firebase_uid,
                title=t["title"],
                description=t["description"],
                priority=t["priority"],
                estimated_time=t["estimated_time"],
                status=t["status"]
            )
            db.add(task_obj)
            db.flush()

            db.add(models.DocumentTask(document_id=document_id, task_id=task_obj.id))
            for topic_id in topic_ids:
                db.add(models.TopicTask(topic_id=topic_id, task_id=task_obj.id))

            saved.append(task_obj)

            db.commit()
            print(f"Committed {len(saved)} tasks")

        return {
            "BACKLOG": [t for t in tasks_json if t["status"] == "BACKLOG"],
            "IN PROGRESS": [t for t in tasks_json if t["status"] == "IN PROGRESS"],
            "REVISING": [t for t in tasks_json if t["status"] == "REVISING"],
            "DONE": [t for t in tasks_json if t["status"] == "DONE"],
        }
            

    except Exception as e:
        return {"tasks": [], "error": str(e)}
    

class UpdateTaskBody(BaseModel):
    status: str | None = None
    title: str | None = None
    description: str | None = None
    estimated_time: float | None = None
    priority: str | None = None

@app.patch("/tasks/{task_id}")
def update_task(
    task_id: int,
    body: UpdateTaskBody,
    firebase_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    firebase_uid = firebase_user["uid"]

    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == firebase_uid
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if body.status is not None: task.status = body.status
    if body.title is not None: task.title = body.title
    if body.description is not None: task.description = body.description
    if body.estimated_time is not None: task.estimated_time = body.estimated_time
    if body.priority is not None: task.priority = body.priority

    db.commit()
    return {"message": "Task updated", "task_id": task_id}


@app.post('/topic/{topic_id}/tasks')
def get_tasks(topic_id: int, firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    firebase_uid = firebase_user["uid"]

    topic = db.query(models.Topic).filter(
        models.Topic.id == topic_id,
        models.Topic.user_id == firebase_uid
    ).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    all_topic_tasks = {
        "BACKLOG": [],
        "IN PROGRESS": [],
        "REVISING": [],
        "DONE": [],
    }
    docs = [dt.document_id for dt in topic.documents]
    for doc_id in docs:
        existing_tasks = db.query(models.DocumentTask).filter_by(document_id=doc_id).all()
        if existing_tasks:
            for dt in existing_tasks:
                task = db.query(models.Task).filter(models.Task.id == dt.task_id).first()
                if task.status == "BACKLOG":
                    all_topic_tasks["BACKLOG"].append({
                        "id": task.id,
                        "title": task.title,
                        "description": task.description,
                        "priority": task.priority,
                        "status": task.status,
                        "estimated_time": task.estimated_time
                    })
                elif task.status =="IN PROGRESS":
                    all_topic_tasks["IN PROGRESS"].append({
                        "id": task.id,
                        "title": task.title,
                        "description": task.description,
                        "priority": task.priority,
                        "status": task.status,
                        "estimated_time": task.estimated_time
                    })
                elif task.status == "REVISING":
                    all_topic_tasks["REVISING"].append({
                        "id": task.id,
                        "title": task.title,
                        "description": task.description,
                        "priority": task.priority,
                        "status": task.status,
                        "estimated_time": task.estimated_time
                    })
                else:
                    all_topic_tasks["DONE"].append({
                        "id": task.id,
                        "title": task.title,
                        "description": task.description,
                        "priority": task.priority,
                        "status": task.status,
                        "estimated_time": task.estimated_time
                    })

        else:
            prompt = """
                Generate a list of actionable study tasks based on this document that a user could follow to prepare for an exam. 
                Each task should have the following fields:
                - title: short descriptive name of the task
                - description: detailed explanation of what to do
                - priority: high, medium, or low
                - estimated_time: time to complete in minutes
                - status: initialize all of them to BACKLOG

                Return ONLY valid JSON in the following format:
                [
                    {
                        "title": "...",
                        "description": "...",
                        "priority": "...",
                        "estimated_time": ...
                        "status": "BACKLOG"
                    }, {
                        "title": "...",
                        "description": "...",
                        "priority": "...",
                        "estimated_time": ...
                        "status": "BACKLOG"
                    }
                ]
                """

            document = db.query(models.Document).filter(
                models.Document.id == doc_id,
                models.Document.user_id == firebase_uid
            ).first()
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
    
            try:
                result = subprocess.run(
                        ["ollama", "run", "gemma3:4b", prompt + extract_text_from_pdf(document.file_path)],
                        capture_output=True,
                        text=True,
                        timeout=500
                    )

                raw_output = result.stdout.strip()
                cleaned = re.sub(r"```json|```", "", raw_output).strip()
                tasks_json = json.loads(cleaned)
                for t in tasks_json:
                    all_topic_tasks["BACKLOG"].append({
                        "id": task.id,
                        "title": task.title,
                        "description": task.description,
                        "priority": task.priority,
                        "status": task.status,
                        "estimated_time": task.estimated_time
                    })
            
                topic_ids = [dt.topic_id for dt in document.topics]
                saved = []
                for t in tasks_json:
                    task_obj = models.Task(
                        user_id=firebase_uid,
                        title=t["title"],
                        description=t["description"],
                        priority=t["priority"],
                        estimated_time=t["estimated_time"],
                        status=t["status"]
                    )
                    db.add(task_obj)
                    db.flush()

                    db.add(models.DocumentTask(document_id=doc_id, task_id=task_obj.id))
                    for topic_id in topic_ids:
                        db.add(models.TopicTask(topic_id=topic_id, task_id=task_obj.id))

                    saved.append(task_obj)

                    db.commit()
                    print(f"Committed {len(saved)} tasks")

                return all_topic_tasks
                
            except Exception as e:
                return {"tasks": [], "error": str(e)}
    

@app.get("/tasks")
def get_all_tasks(firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    firebase_uid = firebase_user["uid"]

    tasks = db.query(models.Task).filter(models.Task.user_id == firebase_uid).all()

    kanban = {
        "BACKLOG": [],
        "IN PROGRESS": [],
        "REVISING": [],
        "DONE": []
    }
    for t in tasks:
        if t.status == "BACKLOG":
            kanban["BACKLOG"].append({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "priority": t.priority,
                "status": t.status,
                "estimated_time": t.estimated_time
            })
        elif t.status =="IN PROGRESS":
            kanban["IN PROGRESS"].append({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "priority": t.priority,
                "status": t.status,
                "estimated_time": t.estimated_time
            })
        elif t.status == "REVISING":
            kanban["REVISING"].append({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "priority": t.priority,
                "status": t.status,
                "estimated_time": t.estimated_time
            })
        else:
            kanban["DONE"].append({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "priority": t.priority,
                "status": t.status,
                "estimated_time": t.estimated_time
            })

    return {"kanban": kanban}



@app.get("/tasks/{task_id}/exercises") 
def generate_exercises(task_id: int, firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    
    firebase_uid = firebase_user["uid"]

    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == firebase_uid
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    prompt = """
        Generate 10 exercises to test knowledge on the following task and return it in JSON format with question and solution
        as separate fields of the JSON object.
    """ + task.title + task.description

    try:
        result = subprocess.run(
            ["ollama", "run", "gemma3:4b", prompt],
            capture_output=True,
            text=True,
            timeout=500
        )
        raw_output = result.stdout.strip()
        cleaned = re.sub(r"```json|```", "", raw_output).strip()
        exercises_json = json.loads(cleaned)
    except Exception as e:
        exercises_json = []
        print(f"Error generating exercises for task {task.id}: {e}")

    return {"exercises": exercises_json}


from collections import defaultdict
@app.get("/tasks/analytics")
def get_analytics(firebase_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = firebase_user['uid']
    
    # Pie chart (tasks grouped by status)
    all_tasks = db.query(models.Task)\
        .filter(models.Task.user_id == user_id)\
        .all()

    status_counts = defaultdict(int)
    for task in all_tasks:
        status_counts[task.status] += 1

    status_data = [{"status": s, "count": c} for s, c in status_counts.items()]

    return {
        "status_breakdown": status_data
    }