FROM python:3.12-slim
WORKDIR /agent
COPY agents/base_http_agent.py ./server.py
COPY aitraders ./aitraders
ENV AGENT_ID=post-trade-review
ENV AGENT_NAME="Post-Trade Review Agent"
ENV AGENT_ROLE="Explains wins and losses, classifies trade outcomes, and records strategy lessons."
ENV PORT=7005
EXPOSE 7005
CMD ["python", "server.py"]
