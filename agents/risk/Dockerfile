FROM python:3.12-slim
WORKDIR /agent
COPY aitraders ./aitraders
COPY agents/risk/server.py ./server.py
ENV PORT=7003
EXPOSE 7003
CMD ["python", "server.py"]
