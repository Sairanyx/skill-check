# The demo on the server: the same image as Chris's run.py, with the front end built inside the image
# (run.py builds it on a laptop with bun first). The server serves ./public and keeps interviews in ./data.
FROM node:22-bookworm AS web
WORKDIR /web
COPY frontend/package.json ./
RUN npm install --no-audit --no-fund
COPY frontend ./
RUN npx vite build

FROM rust:1-bookworm AS build
WORKDIR /src
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /src/target/release/skillcheck-booth /app/server
COPY --from=web /web/build /app/public
ENV PORT=8020 DATA_DIR=/app/data
CMD ["/app/server"]
