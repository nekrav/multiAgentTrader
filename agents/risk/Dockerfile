FROM python:3.12-slim
WORKDIR /app
COPY aitraders ./aitraders
COPY agents/risk/server.py ./agents/risk/server.py
ENV PORT=7003
EXPOSE 7003
CMD ["python", "agents/risk/server.py"]
