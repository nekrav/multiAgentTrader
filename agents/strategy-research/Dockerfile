FROM python:3.12-slim
WORKDIR /app
COPY aitraders ./aitraders
COPY agents/strategy-research/server.py ./agents/strategy-research/server.py
ENV PORT=7002
EXPOSE 7002
CMD ["python", "agents/strategy-research/server.py"]
