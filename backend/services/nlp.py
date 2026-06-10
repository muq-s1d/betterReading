import threading
from collections import Counter
from transformers import pipeline as hf_pipeline

_classifier = None
_lock = threading.Lock()

NEUTRAL_CONFIDENCE_THRESHOLD = 0.70
SMOOTHING_WINDOW = 3

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
                    model="monologg/bert-base-cased-goemotions-original",
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
            if (
                EMOTION_MAP.get(best["label"], "Neutral") == "Neutral"
                and best["score"] < NEUTRAL_CONFIDENCE_THRESHOLD
            ):
                for score_entry in sorted(scores, key=lambda x: -x["score"]):
                    if EMOTION_MAP.get(score_entry["label"], "Neutral") != "Neutral":
                        best = score_entry
                        break
            results.append({
                "chunk_index": i + j,
                "emotion": EMOTION_MAP.get(best["label"], "Neutral"),
                "confidence": round(best["score"], 4),
            })
    return results


def smooth_emotions(emotions: list[str], window: int = SMOOTHING_WINDOW) -> list[str]:
    """Centered mode filter: smooths out isolated single-chunk outliers
    while reacting immediately to sustained mood shifts."""
    half = window // 2
    smoothed = []
    for i, current in enumerate(emotions):
        start = max(0, i - half)
        end = min(len(emotions), i + half + 1)
        counts = Counter(emotions[start:end])
        max_count = max(counts.values())
        winners = [e for e, c in counts.items() if c == max_count]
        if current in winners:
            smoothed.append(current)
        else:
            smoothed.append(winners[0])
    return smoothed
