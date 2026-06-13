FROM python:3.12-slim
WORKDIR /agent
COPY aitraders ./aitraders
COPY agents/event-analysis/server.py ./server.py
ENV PORT=7006
EXPOSE 7006
CMD ["python", "server.py"]
