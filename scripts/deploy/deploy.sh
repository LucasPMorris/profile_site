#!/usr/bin/env bash
#
# deploy.sh - runs on the dev box (CommandCenter). One command, whole cutover.
#
#   ./scripts/deploy/deploy.sh              deploy origin/<branch> to the server
#   ./scripts/deploy/deploy.sh --force      rebuild even when the sha is unchanged
#   ./scripts/deploy/deploy.sh --branch x   deploy a different branch
#   ./scripts/deploy/deploy.sh restart      restart the service, no rebuild
#   ./scripts/deploy/deploy.sh rollback     step back one release
#   ./scripts/deploy/deploy.sh status       what is live right now
#   ./scripts/deploy/deploy.sh logs [n|-f]  tail the app journal
#
# The real work happens in remote-deploy.sh. This script pipes THAT file over
# ssh and runs it with `bash -s`, so the deploy logic that executes is always
# the copy in this working tree. No chicken-and-egg where a deploy has to land
# on the server before the server can run the new deploy script.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_SCRIPT="$SCRIPT_DIR/remote-deploy.sh"
CONFIG="${DEPLOY_CONFIG:-$SCRIPT_DIR/deploy.env}"

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; YEL=$'\033[33m'; RESET=$'\033[0m'
say()  { echo "${BOLD}deploy${RESET} $*"; }
warn() { echo "${YEL}deploy${RESET} $*"; }
die()  { echo "${RED}deploy${RESET} $*" >&2; exit 1; }

# ──────────────────────────────────────────────────────────────────────────
#  CONFIG
# ──────────────────────────────────────────────────────────────────────────

if [[ ! -f $CONFIG ]]; then
  die "missing ${CONFIG}
      cp scripts/deploy/deploy.env.example scripts/deploy/deploy.env  and fill it in"
fi
set -a
# shellcheck disable=SC1090
source "$CONFIG"
set +a

: "${DEPLOY_HOST:?set DEPLOY_HOST in deploy.env}"
: "${DEPLOY_USER:?set DEPLOY_USER in deploy.env}"
DEPLOY_SSH_PORT="${DEPLOY_SSH_PORT:-22}"
DEPLOY_ROOT="${DEPLOY_ROOT:-$HOME/node/profile_site}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_REPO_URL="${DEPLOY_REPO_URL:-git@github-profile-site:LucasPMorris/profile_site.git}"
APP_SERVICE="${APP_SERVICE:-profile-site}"
APP_PORT="${APP_PORT:-4060}"
HEALTH_PATH="${HEALTH_PATH:-/}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

# ──────────────────────────────────────────────────────────────────────────
#  ARGUMENTS
# ──────────────────────────────────────────────────────────────────────────

COMMAND=deploy
ASSUME_YES=false
REMOTE_ARGS=()

while (( $# )); do
  case "$1" in
    deploy|restart|rollback|status|logs) COMMAND="$1" ;;
    --branch) DEPLOY_BRANCH="${2:?--branch needs a value}"; shift ;;
    --force)  REMOTE_ARGS+=('--force') ;;
    --yes|-y) ASSUME_YES=true ;;
    -h|--help) awk 'NR<3{next} /^#/{sub(/^# ?/,""); print; next} {exit}' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) REMOTE_ARGS+=("$1") ;;
  esac
  shift
done

[[ -f $REMOTE_SCRIPT ]] || die "missing ${REMOTE_SCRIPT}"

# ──────────────────────────────────────────────────────────────────────────
#  PREFLIGHT
# ──────────────────────────────────────────────────────────────────────────

# The server deploys origin/<branch>. Anything sitting only on this machine
# will not ship, so surface the drift before a build burns ten minutes.
preflight() {
  git -C "$SCRIPT_DIR" rev-parse --git-dir >/dev/null 2>&1 || return 0

  local drift=()
  git fetch --quiet origin "$DEPLOY_BRANCH" 2>/dev/null || warn "could not fetch origin, reporting on stale refs"

  local remote_sha local_sha
  remote_sha="$(git rev-parse --short "origin/${DEPLOY_BRANCH}" 2>/dev/null || echo '')"
  local_sha="$(git rev-parse --short "$DEPLOY_BRANCH" 2>/dev/null || echo '')"
  [[ -n $remote_sha ]] || die "origin/${DEPLOY_BRANCH} does not exist"

  if [[ -n $local_sha && $local_sha != "$remote_sha" ]]; then
    local ahead
    ahead="$(git rev-list --count "origin/${DEPLOY_BRANCH}..${DEPLOY_BRANCH}" 2>/dev/null || echo 0)"
    if (( ahead > 0 )); then drift+=("${ahead} local commit(s) on ${DEPLOY_BRANCH} are not pushed"); fi
  fi
  if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    drift+=("working tree has uncommitted changes")
  fi
  local branch_now
  branch_now="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
  if [[ -n $branch_now && $branch_now != "$DEPLOY_BRANCH" ]]; then
    drift+=("you are on ${branch_now}, deploying ${DEPLOY_BRANCH}")
  fi

  say "target   ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_SSH_PORT}${DIM} ${DEPLOY_ROOT}${RESET}"
  say "deploying origin/${DEPLOY_BRANCH} at ${BOLD}${remote_sha}${RESET}"
  say "${DIM}$(git log -1 --format='%s  (%an, %ar)' "origin/${DEPLOY_BRANCH}" 2>/dev/null)${RESET}"

  if (( ${#drift[@]} )); then
    echo
    for d in "${drift[@]}"; do warn "  ${d}"; done
    echo
    if [[ $ASSUME_YES == false ]]; then
      read -r -p "deploy origin/${DEPLOY_BRANCH} anyway? [y/N] " reply
      [[ $reply =~ ^[Yy]$ ]] || die "cancelled"
    fi
  fi
}

if [[ $COMMAND == deploy ]]; then preflight; fi

# ──────────────────────────────────────────────────────────────────────────
#  RUN
# ──────────────────────────────────────────────────────────────────────────

# Config travels as an inline env prefix; the script itself travels on stdin.
REMOTE_ENV=$(printf '%s ' \
  "DEPLOY_ROOT='${DEPLOY_ROOT}'" \
  "DEPLOY_BRANCH='${DEPLOY_BRANCH}'" \
  "DEPLOY_REPO_URL='${DEPLOY_REPO_URL}'" \
  "APP_SERVICE='${APP_SERVICE}'" \
  "APP_PORT='${APP_PORT}'" \
  "HEALTH_PATH='${HEALTH_PATH}'" \
  "HEALTH_TIMEOUT='${HEALTH_TIMEOUT}'" \
  "KEEP_RELEASES='${KEEP_RELEASES}'")

SSH_FLAGS=(-p "$DEPLOY_SSH_PORT" -o ConnectTimeout=10)
# logs -f needs a tty so ctrl-c reaches journalctl instead of orphaning it.
if [[ $COMMAND == logs && ${REMOTE_ARGS[0]:-} == '-f' ]]; then SSH_FLAGS+=(-t); fi

set +e
ssh "${SSH_FLAGS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "${REMOTE_ENV} bash -s -- ${COMMAND} ${REMOTE_ARGS[*]:-}" < "$REMOTE_SCRIPT"
STATUS=$?
set -e

if (( STATUS == 0 )); then
  if [[ $COMMAND == deploy ]]; then say "live at ${BOLD}${SITE_URL:-https://lucas.untethered4life.com}${RESET}"; fi
else
  warn "remote ${COMMAND} exited ${STATUS}"
  warn "  ./scripts/deploy/deploy.sh logs 200    to read the journal"
  warn "  ./scripts/deploy/deploy.sh rollback    to step back a release"
fi
exit $STATUS
