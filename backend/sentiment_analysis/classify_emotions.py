from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForSequenceClassification
from transformers import pipeline
import os

model_id = "SamLowe/roberta-base-go_emotions-onnx"

tokenizer = AutoTokenizer.from_pretrained(model_id)
model = ORTModelForSequenceClassification.from_pretrained(model_id)

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

