#!/usr/bin/env bash
#
# remote-deploy.sh - runs ON the production server.
#
# Two ways in:
#   1. piped from the dev box by scripts/deploy/deploy.sh (`ssh ... bash -s`)
#   2. directly on the server: /home/geekom/node/profile_site/repo/scripts/deploy/remote-deploy.sh deploy
#
# Layout it assumes (created by setup/bootstrap.sh):
#   $DEPLOY_ROOT/repo                 full clone, fetched at the top of every deploy
#   $DEPLOY_ROOT/releases/<stamp>     immutable git worktree per deploy
#   $DEPLOY_ROOT/current              symlink to the live release
#   $DEPLOY_ROOT/shared/app.env       production env, used at build time and runtime
#   $DEPLOY_ROOT/shared/logs          deploy log, the app itself logs to the journal
#   $DEPLOY_ROOT/shared/uploads       media written by pages/api/upload.ts
#
# The running app is never touched until the new release has installed, generated
# its Prisma client, and built. The cutover is a symlink move; rollback is the
# same move in reverse.

set -Eeuo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-$HOME/node/profile_site}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_REPO_URL="${DEPLOY_REPO_URL:-git@github-profile-site:LucasPMorris/profile_site.git}"
APP_SERVICE="${APP_SERVICE:-profile-site}"
APP_PORT="${APP_PORT:-4060}"
HEALTH_PATH="${HEALTH_PATH:-/}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

REPO="$DEPLOY_ROOT/repo"
RELEASES="$DEPLOY_ROOT/releases"
SHARED="$DEPLOY_ROOT/shared"
CURRENT="$DEPLOY_ROOT/current"
DEPLOY_LOG="$SHARED/logs/DeployLog.log"

COMMAND="${1:-deploy}"
shift || true
FORCE=false
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=true ;;
  esac
done

# ──────────────────────────────────────────────────────────────────────────
#  LOGGING
# ──────────────────────────────────────────────────────────────────────────

# Same line shape as the lir-app pipeline, so both deploy logs read alike:
# [YYYY-MM-DD HH:MM:SS] [LEVEL] [operation              ] message
log() {
  local level="${2:-INFO}" line
  line="$(printf '[%s] [%-5s] [%-24s] %s' "$(date -u '+%Y-%m-%d %H:%M:%S')" "$level" 'deploy' "$1")"
  echo "$line"
  if [[ -d ${DEPLOY_LOG%/*} ]]; then echo "$line" >> "$DEPLOY_LOG"; fi
}
warn() { log "$1" 'WARN'; }
fail() { log "$1" 'FATAL'; exit 1; }

# ──────────────────────────────────────────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────────────────────────────────────────

current_release() { if [[ -L $CURRENT ]]; then readlink -f "$CURRENT"; else echo ''; fi }

release_name() { if [[ -n ${1:-} ]]; then basename "$1"; else echo '(none)'; fi }

release_sha() {
  if [[ -n ${1:-} && -e ${1:-} ]]; then git -C "$1" rev-parse --short HEAD 2>/dev/null || echo 'unknown'
  else echo 'unknown'; fi
}

# Releases newest first. Ordering drives both rollback and prune, so it cannot
# rest on the timestamp alone: two deploys inside the same second would sort by
# their sha suffix and hand back the wrong "previous" release. The zero-padded
# sequence prefix makes lexical order identical to deploy order, always.
list_releases() { ls -1 "$RELEASES" 2>/dev/null | sort -r || true; }

next_seq() {
  local max=0 n
  while read -r r; do
    n="${r%%-*}"
    [[ $n =~ ^[0-9]+$ ]] || continue
    if (( 10#$n > max )); then max=$(( 10#$n )); fi
  done < <(list_releases)
  printf '%05d' $(( max + 1 ))
}

svc() {
  if sudo -n systemctl "$1" "$APP_SERVICE" 2>/dev/null; then return 0; fi
  fail "Failed to $1 ${APP_SERVICE}: passwordless sudo unavailable, install the sudoers drop-in from setup/bootstrap.sh"
}

# Polls the app until it answers or HEALTH_TIMEOUT expires.
health_check() {
  local url="http://127.0.0.1:${APP_PORT}${HEALTH_PATH}"
  local started=$SECONDS deadline=$(( SECONDS + HEALTH_TIMEOUT ))
  log "Waiting for health | url=${url} | timeout=${HEALTH_TIMEOUT}s"
  while (( SECONDS < deadline )); do
    if ! systemctl is-active --quiet "$APP_SERVICE"; then
      warn "Service is not active while polling health | service=${APP_SERVICE}"
      return 1
    fi
    if curl -fsS -o /dev/null --max-time 10 "$url"; then
      log "Health check passed | elapsed=$(( SECONDS - started ))s"
      return 0
    fi
    sleep 3
  done
  warn "Health check timed out | timeout=${HEALTH_TIMEOUT}s"
  return 1
}

# Reads app.env the way systemd reads an EnvironmentFile, rather than sourcing
# it. Two reasons, both of which have teeth:
#   1. `source` executes the file. One unbalanced quote in a secret is a shell
#      syntax error, which aborts the whole script before any trap can run and
#      leaves a half-built release behind.
#   2. `source` expands $VAR and `cmd` inside values. systemd does not. A `$` in
#      a Spotify refresh token would silently build with a different value than
#      the running app gets, which is the kind of bug that costs a weekend.
# Values are never evaluated here, only assigned.
load_env() {
  local file="$1" line key value
  while IFS= read -r line || [[ -n $line ]]; do
    line="${line%$'\r'}"                            # tolerate CRLF from a Windows paste
    [[ -z ${line//[[:space:]]/} ]] && continue      # blank
    [[ ${line#"${line%%[![:space:]]*}"} == \#* ]] && continue   # comment
    [[ $line == *=* ]] || continue
    key="${line%%=*}"; value="${line#*=}"
    key="${key//[[:space:]]/}"
    [[ $key =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    # strip one layer of matching quotes, exactly as systemd does
    if   [[ ${#value} -ge 2 && ${value:0:1} == '"'  && ${value: -1} == '"'  ]]; then value="${value:1:-1}"
    elif [[ ${#value} -ge 2 && ${value:0:1} == "'"  && ${value: -1} == "'"  ]]; then value="${value:1:-1}"
    fi
    export "${key}=${value}"
  done < "$file"
}

# Atomic: build the new symlink beside the old one, then rename over it. The
# app process only sees the change on its next start, which is why the caller
# always restarts right after.
switch_to() {
  local target="$1"
  ln -sfn "$target" "$DEPLOY_ROOT/.current.tmp"
  mv -Tf "$DEPLOY_ROOT/.current.tmp" "$CURRENT"
  log "Switched current | release=$(release_name "$target") | sha=$(release_sha "$target")"
}

# ──────────────────────────────────────────────────────────────────────────
#  UPLOADED MEDIA
# ──────────────────────────────────────────────────────────────────────────

# public/images is doing two jobs: it holds 109 committed asset files AND it is
# the destination pages/api/upload.ts writes to. A fresh worktree therefore has
# the committed half and none of the uploaded half.
#
# A symlink into shared/ would hide the committed files, so instead the two are
# merged. Uploaded files are exactly the files git does not track, and because a
# release IS a git worktree, git can name them precisely rather than us guessing
# by filename or mtime.
#
# On Render this directory was ephemeral, so uploads were already being lost on
# every redeploy. This makes them durable for the first time.
harvest_uploads() {
  local prev="$1" n=0 rel
  if [[ -z $prev || ! -d $prev/public/images ]]; then return 0; fi
  mkdir -p "$SHARED/uploads/images"
  while IFS= read -r rel; do
    [[ -n $rel ]] || continue
    mkdir -p "$SHARED/uploads/$(dirname "${rel#public/}")"
    cp -a "$prev/$rel" "$SHARED/uploads/${rel#public/}"
    n=$(( n + 1 ))
  done < <(git -C "$prev" ls-files --others --exclude-standard -- public/images 2>/dev/null || true)
  if (( n )); then log "Harvested uploaded media | count=${n} | from=$(release_name "$prev")"; fi
}

restore_uploads() {
  local release="$1" n
  if [[ ! -d $SHARED/uploads ]]; then return 0; fi
  n="$(find "$SHARED/uploads" -type f 2>/dev/null | wc -l)"
  if (( n == 0 )); then return 0; fi
  # -n so a file that has since become a committed asset under the same name is
  # not overwritten by the older uploaded copy. The commit is the intent.
  cp -an "$SHARED/uploads/." "$release/public/" 2>/dev/null || true
  log "Restored uploaded media | count=${n}"
}

# ──────────────────────────────────────────────────────────────────────────
#  RELEASE PREPARATION
# ──────────────────────────────────────────────────────────────────────────

# Unlike lir-app there is nothing to symlink here: public/sitemap*.xml and
# robots.txt are committed to this repo, and `postbuild` regenerates them into
# the worktree on every build. The only shared state is app.env and uploads.
link_shared() {
  local release="$1" prev="$2"

  # Next reads .env.local at build time and at runtime; systemd reads the same
  # file as its EnvironmentFile. One file, two readers, no chance of drift.
  # .env*.local is gitignored here, so this never dirties the worktree.
  ln -sfn "$SHARED/app.env" "$release/.env.local"

  harvest_uploads "$prev"
  restore_uploads "$release"
}

# npm ci is the slowest step in a deploy by a wide margin. When the lockfile has
# not moved, hardlink the previous release's tree instead: near-instant, and
# near-zero extra disk. npm replaces files rather than editing them in place, so
# the two trees cannot diverge through a shared inode.
install_deps() {
  local release="$1" prev="$2"

  if [[ -n $prev && -d $prev/node_modules ]] \
     && cmp -s "$release/package-lock.json" "$prev/package-lock.json"; then
    log "Reusing node_modules | reason=package-lock unchanged | source=$(release_name "$prev")"
    cp -al "$prev/node_modules" "$release/node_modules"
    rm -rf "$release/node_modules/.cache"

    # The Prisma client is generated INTO node_modules, so the hardlinked copy
    # is literally the previous release's client, sharing inodes with the live
    # one. Running `prisma generate` over it would rewrite files the running app
    # has mapped. Dropping the links first costs nothing (the previous release
    # keeps its own copy) and guarantees this release gets a client built from
    # ITS schema.prisma, which npm ci would otherwise be the only thing to do.
    rm -rf "$release/node_modules/.prisma" "$release/node_modules/@prisma/client/.prisma"
    ( cd "$release" && ./node_modules/.bin/prisma generate >/dev/null )
    log "Regenerated Prisma client | reason=hardlinked node_modules"
    return
  fi

  log "Installing dependencies | reason=package-lock changed or first release"
  # package.json postinstall runs `prisma generate`, so a real install already
  # produces a matching client.
  ( cd "$release" && npm ci --include=dev )
  log "Installed dependencies"
}

prune_releases() {
  local keep="$KEEP_RELEASES" i=0 cur
  cur="$(current_release)"
  while read -r r; do
    [[ -n $r ]] || continue
    i=$(( i + 1 ))
    if (( i <= keep )); then continue; fi
    if [[ "$RELEASES/$r" == "$cur" ]]; then continue; fi
    log "Pruning release | release=${r}"
    git -C "$REPO" worktree remove --force "$RELEASES/$r" 2>/dev/null || rm -rf "$RELEASES/$r"
  done < <(list_releases)
  git -C "$REPO" worktree prune
}

# ──────────────────────────────────────────────────────────────────────────
#  COMMANDS
# ──────────────────────────────────────────────────────────────────────────

cmd_deploy() {
  [[ -d $REPO ]] || fail "Missing repo at ${REPO}, run setup/bootstrap.sh first"
  [[ -f $SHARED/app.env ]] || fail "Missing ${SHARED}/app.env, run setup/bootstrap.sh first"

  log "Deploying | branch=${DEPLOY_BRANCH} | root=${DEPLOY_ROOT}"

  git -C "$REPO" remote set-url origin "$DEPLOY_REPO_URL"
  git -C "$REPO" fetch --prune --quiet origin "$DEPLOY_BRANCH"
  local sha short
  sha="$(git -C "$REPO" rev-parse "origin/${DEPLOY_BRANCH}")"
  short="${sha:0:7}"

  local prev
  prev="$(current_release)"
  if [[ -n $prev && "$(git -C "$prev" rev-parse HEAD 2>/dev/null || echo none)" == "$sha" && $FORCE == false ]]; then
    log "Already at origin/${DEPLOY_BRANCH} | sha=${short} | pass --force to rebuild anyway"
    return 0
  fi

  local release="$RELEASES/$(next_seq)-$(date -u '+%Y%m%d-%H%M%S')-${short}"
  log "Creating release | release=$(release_name "$release") | sha=${short}"
  git -C "$REPO" worktree add --detach --quiet "$release" "$sha"

  # Everything between here and the switch is off to the side. A failure
  # discards the half-built release and leaves the live one serving.
  discard_release() {
    # set -E hands this trap to subshells too, so a failing `( cd && npm ... )`
    # would run the whole teardown once inside the subshell and again in the
    # parent. Only the main shell cleans up; a subshell just reports failure.
    if [[ $BASHPID != $$ ]]; then exit 1; fi
    trap - ERR
    warn "Release preparation failed, discarding | release=$(release_name "$release")"
    git -C "$REPO" worktree remove --force "$release" 2>/dev/null || rm -rf "$release"
    fail "Deploy aborted | service=${APP_SERVICE} still serving $(release_name "$prev")"
  }
  trap discard_release ERR

  # Loaded before install so `prisma generate` sees DATABASE_URL, and before the
  # build because every NEXT_PUBLIC_* bakes into the client bundle there.
  load_env "$SHARED/app.env"

  link_shared "$release" "$prev"
  install_deps "$release" "$prev"

  log "Building | command=npm run build | steps=next build,next-sitemap"
  ( cd "$release" && npm run build )
  log "Built release | release=$(release_name "$release")"

  trap - ERR

  switch_to "$release"
  log "Restarting service | service=${APP_SERVICE}"
  svc restart

  if ! health_check; then
    warn "New release failed its health check, rolling back"
    if [[ -n $prev && -d $prev ]]; then
      switch_to "$prev"
      svc restart
      if health_check; then warn "Rolled back | release=$(release_name "$prev")"
      else warn "Rollback restarted but health still failing, check journalctl -u ${APP_SERVICE}"; fi
    else
      warn "No previous release to roll back to"
    fi
    fail "Deploy failed health check | release=$(release_name "$release")"
  fi

  prune_releases
  log "Deployed | release=$(release_name "$release") | sha=${short} | service=${APP_SERVICE}"
}

# Steps back exactly one release from whatever is live, so a second rollback
# keeps walking backwards instead of returning to the release just rejected.
cmd_rollback() {
  local cur target='' seen=false
  cur="$(release_name "$(current_release)")"

  local rels=()
  mapfile -t rels < <(list_releases)
  for r in "${rels[@]}"; do
    if [[ $seen == true ]]; then target="$RELEASES/$r"; break; fi
    if [[ $r == "$cur" ]]; then seen=true; fi
  done

  [[ -n $target && -d $target ]] || fail "No release older than ${cur} to roll back to"

  log "Rolling back | from=${cur} | to=$(release_name "$target")"
  switch_to "$target"
  svc restart
  health_check || fail "Rollback restarted but health check failed, check journalctl -u ${APP_SERVICE}"
  log "Rolled back | release=$(release_name "$target") | sha=$(release_sha "$target")"
}

cmd_restart() {
  log "Restarting service | service=${APP_SERVICE} | release=$(release_name "$(current_release)")"
  svc restart
  health_check || fail "Service restarted but health check failed, check journalctl -u ${APP_SERVICE}"
  log "Restarted service"
}

cmd_status() {
  local cur
  cur="$(current_release)"
  echo "root      : $DEPLOY_ROOT"
  echo "branch    : $DEPLOY_BRANCH"
  echo "current   : $(release_name "$cur")"
  echo "sha       : $(release_sha "$cur")"
  echo "releases  : $(list_releases | tr '\n' ' ')"
  echo "uploads   : $(find "$SHARED/uploads" -type f 2>/dev/null | wc -l) file(s) in shared"
  echo
  systemctl status "$APP_SERVICE" --no-pager --lines=0 || true
  echo
  if curl -fsS -o /dev/null --max-time 10 "http://127.0.0.1:${APP_PORT}${HEALTH_PATH}"; then
    echo "health    : OK       http://127.0.0.1:${APP_PORT}${HEALTH_PATH}"
  else
    echo "health    : FAILING  http://127.0.0.1:${APP_PORT}${HEALTH_PATH}"
  fi
}

cmd_logs() {
  local n="${1:-100}"
  if [[ $n == '-f' ]]; then journalctl -u "$APP_SERVICE" -f
  else journalctl -u "$APP_SERVICE" -n "$n" --no-pager; fi
}

# ──────────────────────────────────────────────────────────────────────────
#  MAIN
# ──────────────────────────────────────────────────────────────────────────

case "$COMMAND" in
  deploy|rollback|restart)
    # One state-changing operation at a time. A second invocation waits its
    # turn rather than interleaving two builds over the same worktree list.
    exec 200>"$DEPLOY_ROOT/.deploy.lock"
    flock -w 900 200 || fail "Another deploy is holding the lock"
    "cmd_${COMMAND}" "$@"
    ;;
  status) cmd_status ;;
  logs)   cmd_logs "${1:-100}" ;;
  *)      fail "Unknown command: ${COMMAND} | expected=deploy|rollback|restart|status|logs" ;;
esac
