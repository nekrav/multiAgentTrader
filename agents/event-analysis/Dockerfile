FROM python:3.12-slim
WORKDIR /app
COPY aitraders ./aitraders
COPY agents/event-analysis/server.py ./agents/event-analysis/server.py
ENV PORT=7006
EXPOSE 7006
CMD ["python", "agents/event-analysis/server.py"]
