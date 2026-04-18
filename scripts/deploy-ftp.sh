#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# deploy-ftp.sh — Déploiement FTP vers OVH
# Usage: ./deploy-ftp.sh [--dry-run]
# Prérequis: lftp installé (brew install lftp / apt install lftp)
# ────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config — à personnaliser ──────────────────────────────────────────────────
FTP_HOST="${FTP_HOST:-ftp.finitionroyale.fr}"
FTP_USER="${FTP_USER:-}"
FTP_PASS="${FTP_PASS:-}"
FTP_REMOTE_DIR="${FTP_REMOTE_DIR:-/www}"
LOCAL_DIR="${LOCAL_DIR:-./dist}"
DRY_RUN="${1:-}"

# ── Validation ────────────────────────────────────────────────────────────────
if [[ -z "$FTP_USER" || -z "$FTP_PASS" ]]; then
  echo "❌ Variables FTP manquantes."
  echo "   Créez un fichier .env.deploy et sourcez-le :"
  echo "   source .env.deploy && ./scripts/deploy-ftp.sh"
  exit 1
fi

if ! command -v lftp &>/dev/null; then
  echo "❌ lftp non trouvé. Installez-le :"
  echo "   macOS: brew install lftp"
  echo "   Linux: apt install lftp"
  exit 1
fi

if [[ ! -d "$LOCAL_DIR" ]]; then
  echo "❌ Dossier $LOCAL_DIR non trouvé. Lancez d'abord: npm run build"
  exit 1
fi

# ── Build ─────────────────────────────────────────────────────────────────────
echo "🔨 Build en cours..."
npm run build

echo "📦 Génération des pages villes..."
npm run generate:villes

# ── Sync FTP ──────────────────────────────────────────────────────────────────
echo ""
if [[ "$DRY_RUN" == "--dry-run" ]]; then
  echo "🧪 DRY RUN — aucun fichier ne sera transféré"
  DRY_CMD="dry-run"
else
  echo "🚀 Déploiement vers $FTP_HOST$FTP_REMOTE_DIR"
  DRY_CMD=""
fi
echo ""

lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" <<EOF
set ftp:ssl-allow no
set net:timeout 30
set net:max-retries 3
set net:reconnect-interval-base 5
mirror \
  --reverse \
  --verbose \
  --delete \
  --exclude-glob "*.DS_Store" \
  --exclude-glob ".git*" \
  --exclude-glob "*.md" \
  --exclude-glob "*.sh" \
  --exclude-glob "node_modules/" \
  --exclude-glob "src/" \
  --exclude-glob "scripts/" \
  $DRY_CMD \
  $LOCAL_DIR/ $FTP_REMOTE_DIR/
bye
EOF

echo ""
echo "✅ Déploiement terminé — https://www.finitionroyale.fr"
