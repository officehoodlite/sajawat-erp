#!/usr/bin/env bash
# One-time self-signed certificate so Postgres can speak TLS.
# The app refuses to start in production unless DATABASE_URL uses sslmode=require.
# Re-running this script does not replace an existing certificate.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSL_DIR="$ROOT/deploy/postgres/ssl"
mkdir -p "$SSL_DIR"

if [[ -f "$SSL_DIR/server.crt" && -f "$SSL_DIR/server.key" ]]; then
  echo "Postgres TLS certificate already exists. Leaving it in place."
  exit 0
fi

openssl req -new -x509 -days 3650 -nodes \
  -subj "/CN=localhost" \
  -keyout "$SSL_DIR/server.key" \
  -out "$SSL_DIR/server.crt"

chmod 600 "$SSL_DIR/server.key"
chmod 644 "$SSL_DIR/server.crt"
echo "Created $SSL_DIR/server.crt and server.key"
