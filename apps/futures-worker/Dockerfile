FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONPATH=/app
COPY apps/futures-worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/futures-worker/src ./src
EXPOSE 7011
CMD ["python", "-m", "src.main"]
