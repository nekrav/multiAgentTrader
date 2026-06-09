FROM python:3.12-slim
WORKDIR /agent
COPY aitraders ./aitraders
COPY agents/strategy-research/server.py ./server.py
ENV PORT=7002
EXPOSE 7002
CMD ["python", "server.py"]
