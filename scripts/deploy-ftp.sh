#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# deploy-ftp.sh — Déploiement FTP vers OVH
# Usage:
#   source .env.deploy && npm run deploy
#   npm run deploy:dry     # aperçu sans transfert
#
# Prérequis: lftp (brew install lftp / apt install lftp)
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

FTP_HOST="${FTP_HOST:-}"
FTP_USER="${FTP_USER:-}"
FTP_PASS="${FTP_PASS:-}"
REMOTE_DIR="${FTP_REMOTE_DIR:-/www}"
LOCAL_DIR="${LOCAL_DIR:-./dist}"
DRY="${1:-}"

[[ -z "$FTP_USER" || -z "$FTP_PASS" ]] && {
  echo "❌ Variables FTP manquantes. Créez .env.deploy et lancez: source .env.deploy && npm run deploy"
  exit 1
}
command -v lftp >/dev/null || { echo "❌ lftp non trouvé. Installez: brew install lftp"; exit 1; }
[[ -d "$LOCAL_DIR" ]] || { echo "❌ $LOCAL_DIR introuvable. Lancez: npm run build"; exit 1; }

DRY_CMD=""
[[ "$DRY" == "--dry-run" ]] && { echo "🧪 DRY RUN"; DRY_CMD="dry-run"; }

echo "🚀 Déploiement → $FTP_HOST$REMOTE_DIR"

lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" <<EOF
set ftp:ssl-allow no
set net:timeout 30
set net:max-retries 3
mirror --reverse --verbose --delete \
  --exclude-glob ".git*" \
  --exclude-glob "*.sh" \
  --exclude-glob "*.md" \
  --exclude-glob "node_modules/" \
  --exclude-glob "src/" \
  $DRY_CMD \
  $LOCAL_DIR/ $REMOTE_DIR/
bye
EOF

echo "✅ Déployé → https://www.finitionroyale.fr"
