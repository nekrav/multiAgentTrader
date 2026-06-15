FROM python:3.12-slim
WORKDIR /app
COPY aitraders ./aitraders
COPY agents/market-data/server.py ./agents/market-data/server.py
ENV PORT=7001
EXPOSE 7001
CMD ["python", "agents/market-data/server.py"]
