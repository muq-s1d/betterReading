# Build context: repo root (backend.main is a namespace package, no backend/__init__.py)
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt

RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r backend/requirements.txt

# Bake the GoEmotions model into the image so cold starts don't re-download it
RUN python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification; \
AutoTokenizer.from_pretrained('monologg/bert-base-cased-goemotions-original'); \
AutoModelForSequenceClassification.from_pretrained('monologg/bert-base-cased-goemotions-original')"

COPY backend/ backend/

EXPOSE 7860

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
