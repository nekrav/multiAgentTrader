# EC2 Docker Deployment

This stack runs the Next.js web app, NestJS API, Python agents, PostgreSQL, Redis, and a Caddy reverse proxy.

## EC2 Instance

Recommended starting point:

- Ubuntu 24.04 LTS
- t3.small or larger
- 20 GB+ gp3 disk
- Security group inbound: SSH 22 from your IP, HTTP 80 from the internet, HTTPS 443 from the internet

Internal service ports are bound to `127.0.0.1` in `docker-compose.yml`, so they are not exposed publicly by Docker. Caddy is the public entrypoint.

## Install Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
newgrp docker
```

## Deploy

```bash
git clone git@github.com:nekrav/multiAgentTrader.git
cd multiAgentTrader
cp .env.ec2.example .env
```

Edit `.env` before starting:

- Change `POSTGRES_PASSWORD`.
- Update `DATABASE_URL` with the same password.
- Leave `SITE_ADDRESS=:80` for public-IP testing.
- If you have a DNS name pointed at EC2, set `SITE_ADDRESS=your-domain.example` and `CORS_ORIGIN=https://your-domain.example`.

Start the stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Check health:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl http://localhost/api/health
curl http://localhost/api/dashboard
```

Open:

```text
http://EC2_PUBLIC_IP/
```

or, with DNS:

```text
https://your-domain.example/
```

## Operations

View logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=150
```

Restart after pulling updates:

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Stop:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

Back up Postgres volume before destructive maintenance:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec postgres pg_dump -U aitraders aitraders > aitraders-backup.sql
```

## Current Limits

This deployment is production-shaped, but the current app still uses seeded deterministic market-intelligence data for the MVP dashboard. Live market ingestion, auth, billing, and persistent agent-output workflows still need to be connected before selling subscriptions.
