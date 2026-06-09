FROM python:3.12-slim
WORKDIR /agent
COPY aitraders ./aitraders
COPY agents/market-data/server.py ./server.py
ENV PORT=7001
EXPOSE 7001
CMD ["python", "server.py"]
