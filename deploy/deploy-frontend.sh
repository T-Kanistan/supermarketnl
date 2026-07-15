#!/usr/bin/env bash
#
# deploy-frontend.sh
# -----------------------------------------------------------------------------
# Builds the frontend for production and syncs dist/ to the Nginx web root.
#
# Prerequisites on your machine:
#   - SSH access to the production droplet
#   - rsync
#
# Usage:
#   export DEPLOY_HOST=user@YOUR_DROPLET_IP
#   export DEPLOY_PATH=/var/www/raguwinswereldwinkel
#   bash deploy/deploy-frontend.sh
# -----------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
HOST="${DEPLOY_HOST:-}"
REMOTE_PATH="${DEPLOY_PATH:-/var/www/raguwinswereldwinkel}"

if [[ -z "$HOST" ]]; then
  echo "Set DEPLOY_HOST first, e.g.:"
  echo "  export DEPLOY_HOST=root@your.server.ip"
  exit 1
fi

echo "==> Building frontend (production)..."
cd "$FRONTEND"
npm run build

echo "==> Syncing dist/ to ${HOST}:${REMOTE_PATH}"
rsync -avz --delete \
  --exclude '.git' \
  "$FRONTEND/dist/" \
  "${HOST}:${REMOTE_PATH}/"

echo "==> Done. Hard-refresh https://raguwinswereldwinkel.nl/food-corner"
echo "    Verify the Food Corner chunk no longer imports fuse.js:"
echo "    curl -s https://raguwinswereldwinkel.nl/assets/FoodCorner-*.js | head -c 200"
