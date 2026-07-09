#!/usr/bin/env bash
#
# fix-nginx-proxy.sh
# -----------------------------------------------------------------------------
# Adds the missing reverse-proxy rules so https://raguwinswereldwinkel.nl/api
# and /uploads are forwarded to the Node backend on 127.0.0.1:5000.
#
# This is the ONLY fix needed for the production 404s. The backend, routes,
# database, and frontend code are all correct and verified — Nginx just was
# never told to forward /api to the backend.
#
# Run on the DigitalOcean droplet as root:
#     sudo bash deploy/fix-nginx-proxy.sh
# -----------------------------------------------------------------------------
set -euo pipefail

DOMAIN="raguwinswereldwinkel.nl"
BACKEND_PORT="5000"

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root:  sudo bash $0"
  exit 1
fi

# 1) Locate the nginx config(s) that serve this domain.
mapfile -t CONFIGS < <(grep -rls "server_name[^;]*${DOMAIN}" /etc/nginx 2>/dev/null || true)
if [ "${#CONFIGS[@]}" -eq 0 ]; then
  echo "ERROR: No nginx config references server_name ${DOMAIN}."
  echo "List your sites with:  ls -l /etc/nginx/sites-enabled/  and inspect them."
  exit 1
fi

# 2) Write the proxy snippet (quoted heredoc => no variable expansion here).
SNIPPET="$(mktemp)"
cat > "$SNIPPET" <<'EOF'

    # >>> wins-api-proxy (added by fix-nginx-proxy.sh) >>>
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }
    # Social crawlers need server-rendered Open Graph HTML for /offers/:id and /vacancies/:id.
    # Requires $is_social_crawler map in nginx http { } — see nginx.conf.example.
    location ~ ^/(vacancies|offers)/([^/?#]+)$ {
        if ($is_social_crawler) {
            proxy_pass http://127.0.0.1:5000/$1/$2;
        }
        try_files $uri $uri/ /index.html;
    }
    # <<< wins-api-proxy <<<
EOF

MAP_SNIPPET="$(mktemp)"
cat > "$MAP_SNIPPET" <<'EOF'

# >>> wins-social-crawler-map (added by fix-nginx-proxy.sh) >>>
map $http_user_agent $is_social_crawler {
    default 0;
    "~*facebookexternalhit" 1;
    "~*Facebot" 1;
    "~*Twitterbot" 1;
    "~*LinkedInBot" 1;
    "~*WhatsApp" 1;
    "~*Slackbot" 1;
    "~*TelegramBot" 1;
    "~*Discordbot" 1;
    "~*Pinterest" 1;
    "~*redditbot" 1;
    "~*Applebot" 1;
    "~*SkypeUriPreview" 1;
    "~*vkShare" 1;
}
# <<< wins-social-crawler-map <<<
EOF

NGINX_CONF="/etc/nginx/nginx.conf"
if [ -f "$NGINX_CONF" ] && ! grep -q "wins-social-crawler-map" "$NGINX_CONF"; then
  ts_map="$(date +%Y%m%d%H%M%S)"
  cp "$NGINX_CONF" "${NGINX_CONF}.bak.${ts_map}"
  sed "/http {/r ${MAP_SNIPPET}" "${NGINX_CONF}.bak.${ts_map}" > "$NGINX_CONF"
  echo "Added social-crawler map to ${NGINX_CONF} (backup: ${NGINX_CONF}.bak.${ts_map})"
fi
rm -f "$MAP_SNIPPET"

# 3) Insert the snippet right after each matching server_name line.
for f in "${CONFIGS[@]}"; do
  if grep -q "wins-api-proxy" "$f"; then
    echo "Already patched, skipping: $f"
    continue
  fi
  ts="$(date +%Y%m%d%H%M%S)"
  cp "$f" "${f}.bak.${ts}"
  # sed 'r' reads the snippet file in literally after the matched line,
  # so $host / $remote_addr etc. are preserved exactly.
  sed "/server_name[^;]*${DOMAIN}/r ${SNIPPET}" "${f}.bak.${ts}" > "$f"
  echo "Patched: $f   (backup: ${f}.bak.${ts})"
done

rm -f "$SNIPPET"

# 4) Validate and reload.
echo "Testing nginx configuration..."
if nginx -t; then
  systemctl reload nginx
  echo "Nginx reloaded."
else
  echo "ERROR: nginx -t failed. Restoring backups..."
  for f in "${CONFIGS[@]}"; do
    latest_bak="$(ls -t "${f}".bak.* 2>/dev/null | head -n1 || true)"
    [ -n "${latest_bak}" ] && cp "${latest_bak}" "${f}" && echo "Restored ${f}"
  done
  exit 1
fi

# 5) Verify.
echo ""
echo "Verifying https://${DOMAIN}/api/settings ..."
code="$(curl -s -o /dev/null -w '%{http_code}' "https://${DOMAIN}/api/settings" || true)"
echo "HTTP status: ${code}"
if [ "${code}" = "200" ]; then
  echo "SUCCESS — the API is now reachable through the website. Hard-refresh the site (Ctrl+Shift+R)."
else
  echo "Still not 200. Check that the backend is running:  curl -i http://127.0.0.1:${BACKEND_PORT}/api/settings"
fi
