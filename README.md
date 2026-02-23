# Ambience

Ambience is a static website that lets you create an ambient sound mix. It was built as a university project at the Karlsruhe Institute of Technology (KIT). It uses HTML5 features like the Local Storage API, the Audio API, and range inputs to keep a consistent, dynamic experience across page routes.

[Online Preview](https://ambience.zykes.dev/)

[KIT website](https://www.kit.edu/english/)

## Tech

- Astro static site
- Bun build tooling
- Docker + docker-compose for deployment
- Cloudflare Tunnel for secure public access

## Run locally

Install dependencies and build:
```bash
bun install
bun run build
```

Serve the static output:
```bash
bunx serve dist -p 3000
```

Visit:
```
http://localhost:3000
```

## Run with Docker (server)

1. Create a `.env` file next to `docker-compose.yml`:
```
TUNNEL_TOKEN=your-cloudflare-token
```

2. Start:
```bash
docker compose pull
docker compose up -d
```

The `web` container serves `/dist` and the `cloudflared` sidecar exposes it through the tunnel.

## CI

On every push to `main`, GitHub Actions builds and pushes the Docker image to GHCR. Deployment is manual (pull and restart on the server).
