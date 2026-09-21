#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/wipahs/officehub-repo"
LIVE_DIR="/home/wipahs/office.wipahs.org"
SSH_KEY="/home/wipahs/.ssh/officehub_github"
STATE_DIR="/home/wipahs/.officehub-deploy"
BACKUP_DIR="${STATE_DIR}/backups"
LOG_FILE="${STATE_DIR}/deploy.log"
LOCK_FILE="${STATE_DIR}/deploy.lock"
FORCE_DEPLOY="${1:-}"

mkdir -p "${BACKUP_DIR}"
exec 9>"${LOCK_FILE}"
/usr/bin/flock -n 9 || exit 0
exec >>"${LOG_FILE}" 2>&1

printf '[%s] OfficeHub deployment check\n' "$(date -u +%FT%TZ)"

test -d "${REPO_DIR}/.git"
test -d "${LIVE_DIR}"
test -f "${SSH_KEY}"

cd "${REPO_DIR}"
export GIT_SSH_COMMAND="ssh -i ${SSH_KEY} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

git fetch --quiet origin main
LOCAL_COMMIT="$(git rev-parse HEAD)"
REMOTE_COMMIT="$(git rev-parse origin/main)"

if [[ "${LOCAL_COMMIT}" == "${REMOTE_COMMIT}" && "${FORCE_DEPLOY}" != "--force" ]]; then
  printf '[%s] No new commit\n' "$(date -u +%FT%TZ)"
  exit 0
fi

git merge --ff-only origin/main

test -s index.html
test -d assets
grep -q 'id="root"' index.html

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEPLOY_BACKUP="${BACKUP_DIR}/${STAMP}"
mkdir -p "${DEPLOY_BACKUP}"

for entry_file in index.html .htaccess favicon.svg; do
  if [[ -f "${LIVE_DIR}/${entry_file}" ]]; then
    cp -p "${LIVE_DIR}/${entry_file}" "${DEPLOY_BACKUP}/${entry_file}"
  fi
done

active_release=$(grep -oE "/assets/[^/[:space:]]+" index.html | head -1)
test -n "$active_release"
test -d ".$active_release"
mkdir -p "$LIVE_DIR$active_release"
cp -a ".$active_release/." "$LIVE_DIR$active_release/"
install -m 0644 index.html "${LIVE_DIR}/index.html"

if [[ -f .htaccess ]]; then
  install -m 0644 .htaccess "${LIVE_DIR}/.htaccess"
fi

if [[ -f favicon.svg ]]; then
  install -m 0644 favicon.svg "${LIVE_DIR}/favicon.svg"
fi

# Publish the root-level compatibility modules referenced by index.html.
# These files contain incremental OfficeHub fixes that are intentionally
# separate from the compiled Vite release directory.
grep -oE 'src="/officehub-[^"]+\.js"' index.html \
  | cut -d'"' -f2 \
  | sort -u \
  | while IFS= read -r root_script; do
  source_script=".${root_script}"
  if [[ -f "${source_script}" ]]; then
    install -m 0644 "${source_script}" "${LIVE_DIR}${root_script}"
  fi
done

printf '%s\n' "$(git rev-parse HEAD)" >"${STATE_DIR}/deployed-commit"
printf '[%s] Deployed %s\n' "$(date -u +%FT%TZ)" "$(git rev-parse --short HEAD)"
