from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    firebase_uid = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="owner")
    journal_entries = relationship("JournalEntry", back_populates="owner")
    tasks = relationship("Task", back_populates="owner")
    topics = relationship("Topic", back_populates="owner")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.firebase_uid"))
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    summary = Column(Text, nullable=True)
    mindmap = Column(Text, nullable=True)
    owner = relationship("User", back_populates="documents")
    topics = relationship("DocumentTopic", back_populates="document") 
    tasks = relationship("DocumentTask", back_populates="document")


class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.firebase_uid"))
    name = Column(String, nullable=False)
    embedding = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    mindmap = Column(Text, nullable=True)

    owner = relationship("User", back_populates="topics")
    documents = relationship("DocumentTopic", back_populates="topic")
    tasks = relationship("TopicTask", back_populates="topic")


class DocumentTopic(Base):
    __tablename__ = "document_topics"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"))
    relevance_score = Column(Float, default=1.0)

    document = relationship("Document", back_populates="topics")
    topic = relationship("Topic", back_populates="documents")


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.firebase_uid"))
    title = Column(String, nullable=False)
    description = Column(Text)
    priority = Column(String, default="high")
    status = Column(String, default="Backlog")  # Backlog | In Progress | Revising | Done
    estimated_time = Column(Float, nullable=True)

    owner = relationship("User", back_populates="tasks")
    documents = relationship("DocumentTask", back_populates="task")
    topics = relationship("TopicTask", back_populates="task")
    

class DocumentTask(Base):
    __tablename__ = "document_tasks"
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"))

    document = relationship("Document", back_populates="tasks")
    task = relationship("Task", back_populates="documents")

class TopicTask(Base):
    __tablename__ = "topic_tasks"
    id = Column(Integer, primary_key=True)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"))

    topic = relationship("Topic", back_populates="tasks")
    task = relationship("Task", back_populates="topics")


class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.firebase_uid"))
    content = Column(Text, nullable=False)
    top_emotion = Column(Text, nullable=True)
    sentiment_score = Column(Float, nullable=True)
    sentiment_polarity = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="journal_entries")
