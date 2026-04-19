import pytest
from unittest.mock import patch, MagicMock
import io
from datetime import datetime
from models import User, Document, Topic, JournalEntry, Task


# AUTH TESTS
class TestAuthEndpoints:

    def test_firebase_login_success(self, client):
        with patch("main.firebase_auth.verify_id_token") as mock_verify:
            mock_verify.return_value = {
                "uid": "test_user_123",
                "email": "test@example.com"
            }

            response = client.post(
                "/auth/firebase",
                headers={"Authorization": "Bearer mock_token"}
            )

            assert response.status_code == 200
            assert "user_id" in response.json()


    def test_firebase_login_invalid_token(self, client):
        with patch("main.firebase_auth.verify_id_token") as mock_verify:
            mock_verify.side_effect = Exception("Invalid token")

            response = client.post(
                "/auth/firebase",
                headers={"Authorization": "Bearer bad_token"}
            )

            assert response.status_code == 401


# DOCUMENTS
class TestDocumentEndpoints:

    def test_upload_file_success(self, client):
        files = {"file": ("test.pdf", io.BytesIO(b"data"), "application/pdf")}

        with patch("main.extract_text_from_pdf", return_value="text"), \
             patch("main.assign_topic"):

            response = client.post("/upload", files=files)

            assert response.status_code == 200


    def test_get_documents(self, client):
        response = client.get("/documents")
        assert response.status_code == 200


    def test_delete_document(self, client, db_session):

        doc = Document(
            id=1,
            user_id="test_user_123",
            title="test.pdf",
            file_path="/uploads/test.pdf"
        )
        db_session.add(doc)
        db_session.commit()

        with patch("os.path.exists", return_value=True), \
            patch("os.remove"):

            response = client.delete("/documents/1")

            assert response.status_code == 200

# -----------------------------
# SUMMARY
# -----------------------------
class TestSummaryEndpoints:

    def test_get_summary(self, client, db_session):

        doc = Document(
            id=1,
            user_id="test_user_123",
            title="test.pdf",
            file_path="/uploads/test.pdf"
        )
        db_session.add(doc)
        db_session.commit()

        with patch("main.extract_text_from_pdf", return_value="text"), \
            patch("subprocess.run") as mock_run:

            mock_result = MagicMock()
            mock_result.stdout = "summary"
            mock_run.return_value = mock_result

            response = client.get("/documents/1/summary")

            assert response.status_code == 200

# TOPICS
class TestTopicEndpoints:

    def test_get_topics(self, client):
        response = client.get("/topics")
        assert response.status_code == 200


# JOURNAL
class TestJournalEndpoints:

    def test_save_entry(self, client):
        with patch("main.classify_emotions") as mock_classify:
            mock_classify.return_value = {
                "top_emotion": "joy",
                "sentiment_score": 0.8,
                "all_emotions": {"joy": 0.8}
            }

            response = client.put(
                "/journal/entries",
                json={"content": "Test"}
            )

            assert response.status_code == 200


# TASKS
class TestTaskEndpoints:

    def test_get_tasks(self, client):
        response = client.get("/tasks")
        assert response.status_code == 200


# ANALYTICS
class TestAnalyticsEndpoints:

    def test_sentiment_analytics(self, client):
        response = client.get("/sentiment/analytics")
        assert response.status_code == 200