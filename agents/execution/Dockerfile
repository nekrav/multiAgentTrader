FROM python:3.12-slim
WORKDIR /agent
COPY agents/base_http_agent.py ./server.py
ENV AGENT_ID=execution
ENV AGENT_NAME="Execution Agent"
ENV AGENT_ROLE="Accepts only deterministic execution requests after hard gates pass."
ENV PORT=7004
EXPOSE 7004
CMD ["python", "server.py"]
