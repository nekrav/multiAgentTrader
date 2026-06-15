FROM python:3.12-slim

WORKDIR /app

COPY scripts/news-feed-updater/fetch_news.py ./fetch_news.py

ENV OUTPUT_PATH="/data/news/latest-news.json"
ENV NEWS_FEEDS="https://news.google.com/rss/search?q=forex&hl=en-US&gl=US&ceid=US:en,https://news.google.com/rss/search?q=crypto&hl=en-US&gl=US&ceid=US:en"
ENV UPDATE_INTERVAL_SECONDS="300"
ENV MAX_EVENTS="14"

CMD ["python", "fetch_news.py"]
