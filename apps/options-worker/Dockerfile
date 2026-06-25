FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHONPATH=/app
COPY apps/options-worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/options-worker/src ./src
EXPOSE 7012
CMD ["python", "-m", "src.main"]
