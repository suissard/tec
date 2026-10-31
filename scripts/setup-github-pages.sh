#!/usr/bin/env bash
#
# Configure GitHub Pages pour le site TEC (déploiement par GitHub Actions).
#
# Prérequis :
#   - gh CLI installé (https://cli.github.com) et authentifié (`gh auth login`)
#   - droits d'administration sur le dépôt
#
# Usage :
#   ./scripts/setup-github-pages.sh
#
# Domaine dédié (URL propres, sans hash) :
#   SITE_URL=https://tec-asso.fr BASE_PATH=/ HASH_ROUTER=false \
#     ./scripts/setup-github-pages.sh
#
# Le script est idempotent : relancez-le sans risque.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ gh CLI introuvable. Installez-le : https://cli.github.com" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "❌ gh n'est pas authentifié. Lancez : gh auth login" >&2
  exit 1
fi

REMOTE_URL="$(git config --get remote.origin.url)"
if [[ "$REMOTE_URL" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
else
  echo "❌ Dépôt GitHub introuvable dans remote.origin.url : $REMOTE_URL" >&2
  exit 1
fi

# Valeurs par défaut : GitHub Pages « project site » (https://<owner>.github.io/<repo>/).
BASE_PATH="${BASE_PATH:-"/$REPO/"}"
HASH_ROUTER="${HASH_ROUTER:-true}"
SITE_URL="${SITE_URL:-"https://$OWNER.github.io/$REPO"}"

echo "→ Dépôt   : $OWNER/$REPO"
echo "→ Base    : $BASE_PATH"
echo "→ Routeur : $([ "$HASH_ROUTER" = "true" ] && echo 'hash (/#/…)' || echo 'history (URL propres)')"
echo "→ Site    : $SITE_URL"
echo

# 1) Variables de dépôt consommées par .github/workflows/{ci,deploy}.yml
gh variable set BASE_PATH --repo "$OWNER/$REPO" --body "$BASE_PATH"
gh variable set HASH_ROUTER --repo "$OWNER/$REPO" --body "$HASH_ROUTER"
gh variable set SITE_URL --repo "$OWNER/$REPO" --body "$SITE_URL"
echo "✅ Variables BASE_PATH / HASH_ROUTER / SITE_URL définies"

# 2) Source de publication = GitHub Actions (et non « Deploy from a branch »).
#    PUT met à jour un site existant ; POST le crée s'il n'existe pas encore.
if gh api -X PUT "repos/$OWNER/$REPO/pages" -f build_type=workflow >/dev/null 2>&1; then
  echo "✅ GitHub Pages : source « GitHub Actions »"
elif gh api -X POST "repos/$OWNER/$REPO/pages" -f build_type=workflow >/dev/null 2>&1; then
  echo "✅ GitHub Pages activé : source « GitHub Actions »"
else
  echo "⚠️  Impossible de configurer Pages automatiquement." >&2
  echo "   Faites-le à la main : Settings → Pages → Source → GitHub Actions." >&2
  exit 1
fi

echo
echo "Prochaine étape : pousser sur main, puis suivre Actions → CI → Deploy."
echo "URL : ${SITE_URL%/}/"
