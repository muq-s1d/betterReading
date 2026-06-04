import threading
from transformers import pipeline as hf_pipeline

_classifier = None
_lock = threading.Lock()

EMOTION_MAP = {
    "joy": "Joy",
    "amusement": "Joy",
    "excitement": "Excitement",
    "optimism": "Anticipation",
    "anticipation": "Anticipation",
    "surprise": "Wonder/Awe",
    "admiration": "Wonder/Awe",
    "curiosity": "Mystery",
    "realization": "Mystery",
    "confusion": "Mystery",
    "love": "Romance",
    "desire": "Romance",
    "caring": "Tenderness",
    "gratitude": "Tenderness",
    "relief": "Peace/Calm",
    "approval": "Peace/Calm",
    "neutral": "Neutral",
    "embarrassment": "Neutral",
    "sadness": "Sadness",
    "disappointment": "Sadness",
    "remorse": "Sadness",
    "grief": "Grief/Despair",
    "fear": "Fear",
    "nervousness": "Tension/Suspense",
    "anger": "Anger",
    "annoyance": "Anger",
    "disgust": "Disgust",
    "disapproval": "Disgust",
}


def get_classifier():
    global _classifier
    if _classifier is None:
        with _lock:
            if _classifier is None:
                _classifier = hf_pipeline(
                    "text-classification",
                    model="SamLowe/roberta-base-go_emotions",
                    top_k=None,
                    device=-1,
                    truncation=True,
                    max_length=512,
                )
    return _classifier


def classify_chunks(chunks: list[str], batch_size: int = 16) -> list[dict]:
    classifier = get_classifier()
    results = []
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        try:
            outputs = classifier(batch)
        except Exception:
            for j in range(len(batch)):
                results.append({
                    "chunk_index": i + j,
                    "emotion": "Neutral",
                    "confidence": 0.0,
                })
            continue
        for j, scores in enumerate(outputs):
            best = max(scores, key=lambda x: x["score"])
            results.append({
                "chunk_index": i + j,
                "emotion": EMOTION_MAP.get(best["label"], "Neutral"),
                "confidence": round(best["score"], 4),
            })
    return results
