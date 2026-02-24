from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForSequenceClassification
from transformers import pipeline
import os

MODEL_PATH = os.path.dirname(os.path.abspath(__file__))

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = ORTModelForSequenceClassification.from_pretrained(MODEL_PATH, file_name="model.onnx")

emotion_classifier = pipeline(
    "text-classification",
    model=model,
    tokenizer=tokenizer,
    top_k=None
)


def classify_emotions(text: str):
    results = emotion_classifier(text)
    results = results[0]

    emotion_scores = {r['label']: float(r['score']) for r in results}

    top_emotion = max(emotion_scores, key=emotion_scores.get)
    top_emotion_score = emotion_scores[top_emotion]

    return {
        "top_emotion": top_emotion,
        "sentiment_score": top_emotion_score,
        "all_emotions": emotion_scores
    }

