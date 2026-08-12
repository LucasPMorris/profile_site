#!/usr/bin/env bash
#
# bootstrap.sh - one-time preparation of the production server. Idempotent:
# re-run it whenever a step was blocked and you have unblocked it.
#
# Copy it over and run it as the deploy user. The -t is required: this script
# needs sudo for the systemd unit, and sudo needs a terminal to prompt on.
#   scp scripts/deploy/setup/bootstrap.sh geekom@192.168.1.113:~/
#   ssh -t geekom@192.168.1.113 'bash ~/bootstrap.sh'
#
# It creates the release layout, provisions a repo-scoped GitHub deploy key,
# clones the repo, installs the systemd unit, and grants passwordless
# `systemctl restart profile-site` to the deploy user.
# It never starts the app: fill in shared/app.env first, then deploy.

set -Eeuo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-$HOME/node/profile_site}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
APP_SERVICE="${APP_SERVICE:-profile-site}"
DEPLOY_USER="${DEPLOY_USER:-$(id -un)}"

# This host does not have to be github.com. See section 3: the machine's default
# key is already a deploy key on another repository, and GitHub binds a deploy
# key to exactly one repo, so this one gets its own key behind an ssh alias.
SSH_ALIAS="${SSH_ALIAS:-github-profile-site}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_profile_site}"
REPO_SLUG="${REPO_SLUG:-LucasPMorris/profile_site}"
DEPLOY_REPO_URL="${DEPLOY_REPO_URL:-git@${SSH_ALIAS}:${REPO_SLUG}.git}"

REPO="$DEPLOY_ROOT/repo"
SHARED="$DEPLOY_ROOT/shared"

BOLD=$'\033[1m'; RED=$'\033[31m'; YEL=$'\033[33m'; GRN=$'\033[32m'; RESET=$'\033[0m'
step() { echo; echo "${BOLD}==> $*${RESET}"; }
ok()   { echo "  ${GRN}ok${RESET}    $*"; }
warn() { echo "  ${YEL}note${RESET}  $*"; }
die()  { echo "  ${RED}stop${RESET}  $*" >&2; exit 1; }

# ──────────────────────────────────────────────────────────────────────────
#  1. PREREQUISITES
# ──────────────────────────────────────────────────────────────────────────

step "Checking prerequisites"

for bin in git curl npm node flock; do
  command -v "$bin" >/dev/null 2>&1 || die "${bin} is not installed"
done

# next 15.5 / react 19 want node >= 18.18. This box already runs lir-app on 22,
# so anything below 20 means the wrong node is on PATH for this shell.
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if (( NODE_MAJOR < 20 )); then
  die "node ${NODE_MAJOR} found, next 15 needs >= 18.18 and this host runs 22 elsewhere"
fi
ok "node $(node -v), npm $(npm -v)"

NPM_MAJOR="$(npm -v | cut -d. -f1)"
if (( NPM_MAJOR < 10 )); then
  warn "npm $(npm -v) is older than the npm that wrote package-lock.json"
  warn "  sudo npm install -g npm@11    (or remove the apt npm package so node's own npm is used)"
fi

NPM_BIN="$(command -v npm)"
NODE_BIN_DIR="$(dirname "$(command -v node)")"
case "$NPM_BIN" in
  "$HOME"/.nvm/*) warn "npm comes from nvm, the unit pins PATH=${NODE_BIN_DIR} so systemd can find it" ;;
esac

if command -v pg_isready >/dev/null 2>&1; then
  if pg_isready -q; then ok "postgres reachable on the default port"
  else warn "pg_isready says no server on the default port, check the cluster port and put it in DATABASE_URL"; fi
else
  warn "postgresql-client not installed, skipping the postgres reachability check"
fi

# sudo is needed for the systemd unit and the sudoers drop-in, nothing else.
if ! sudo -n true 2>/dev/null; then
  if [[ ! -t 0 ]]; then
    die "sudo needs a password and there is no terminal to ask on.
        Re-run with a tty:  ssh -t ${DEPLOY_USER}@\$(hostname -I | awk '{print \$1}') 'bash ~/bootstrap.sh'"
  fi
  sudo -v || die "this user needs sudo to install the systemd unit"
fi

# ──────────────────────────────────────────────────────────────────────────
#  2. DIRECTORY LAYOUT
# ──────────────────────────────────────────────────────────────────────────

step "Creating layout at ${DEPLOY_ROOT}"

# Inside $HOME the deploy user already owns the path, so sudo stays out of it.
# Anywhere else (a /srv or /opt style root) needs one privileged mkdir + chown.
if [[ ! -d $DEPLOY_ROOT ]]; then
  case "$DEPLOY_ROOT" in
    "$HOME"/*) mkdir -p "$DEPLOY_ROOT" ;;
    *) sudo mkdir -p "$DEPLOY_ROOT"; sudo chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_ROOT" ;;
  esac
fi
mkdir -p "$DEPLOY_ROOT/releases" "$SHARED/logs" "$SHARED/uploads/images"
ok "releases/ shared/logs shared/uploads/images"

# ──────────────────────────────────────────────────────────────────────────
#  3. GITHUB DEPLOY KEY
# ──────────────────────────────────────────────────────────────────────────

step "Checking GitHub access for ${REPO_SLUG}"

# A GitHub deploy key may be attached to exactly ONE repository. This host's
# ~/.ssh/id_ed25519 is already the lir-app deploy key, so reusing it here would
# authenticate as lir-app and then 404 on this repo, which reads like a missing
# repo rather than a key problem. A second key behind a Host alias keeps the two
# independent, and IdentitiesOnly stops ssh from offering the lir-app key first.
mkdir -p "$HOME/.ssh" && chmod 700 "$HOME/.ssh"

if [[ ! -f $SSH_KEY ]]; then
  ssh-keygen -t ed25519 -N '' -C "${DEPLOY_USER}@$(hostname)-profile-site-deploy" -f "$SSH_KEY"
  ok "generated a dedicated key at ${SSH_KEY}"
fi

if ! grep -q "^Host ${SSH_ALIAS}\$" "$HOME/.ssh/config" 2>/dev/null; then
  cat >> "$HOME/.ssh/config" <<EOF

# Added by profile_site scripts/deploy/setup/bootstrap.sh
Host ${SSH_ALIAS}
  HostName github.com
  User git
  IdentityFile ${SSH_KEY}
  IdentitiesOnly yes
EOF
  chmod 600 "$HOME/.ssh/config"
  ok "added Host ${SSH_ALIAS} to ~/.ssh/config"
else
  ok "Host ${SSH_ALIAS} already in ~/.ssh/config"
fi

ssh-keyscan -t ed25519 github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null
sort -u -o "$HOME/.ssh/known_hosts" "$HOME/.ssh/known_hosts"

# `ssh -T git@github.com` exits 1 even on success, so capture and match the
# banner rather than trusting the status code.
GH_GREETING="$(ssh -o BatchMode=yes -T "git@${SSH_ALIAS}" 2>&1 || true)"
if ! grep -q 'successfully authenticated' <<<"$GH_GREETING"; then
  echo
  echo "  Add this as a read-only deploy key on the repo:"
  echo "  ${BOLD}https://github.com/${REPO_SLUG}/settings/keys/new${RESET}"
  echo
  cat "${SSH_KEY}.pub"
  echo
  die "GitHub rejected this key. Add it, then re-run bootstrap.sh"
fi

# A deploy key names its repository in the banner ("Hi owner/repo!"); an account
# level key names only the user. Either works, but a deploy key for the WRONG
# repo authenticates happily and then cannot see this one.
if grep -qE 'Hi [^ ]+/[^ ]+!' <<<"$GH_GREETING" && ! grep -q "Hi ${REPO_SLUG}!" <<<"$GH_GREETING"; then
  warn "GitHub says: ${GH_GREETING%%$'\n'*}"
  die "that key is a deploy key for a different repository.
        Delete ${SSH_KEY}, re-run, and add the NEW public key to ${REPO_SLUG}"
fi
ok "GitHub authenticates this key for ${REPO_SLUG}"

# ──────────────────────────────────────────────────────────────────────────
#  4. REPO CLONE
# ──────────────────────────────────────────────────────────────────────────

step "Cloning the repo"

if [[ -d $REPO/.git ]]; then
  git -C "$REPO" remote set-url origin "$DEPLOY_REPO_URL"
  git -C "$REPO" fetch --prune --quiet origin "$DEPLOY_BRANCH"
  # A fetch moves the remote refs and nothing else, so the files on disk would
  # still be whatever this clone was created at. This script reads the systemd
  # unit template off that tree, so it has to match what was just fetched.
  # Hard reset is safe here: repo/ is a machine-managed mirror, releases are
  # detached worktrees, and nothing in it is ever hand-edited.
  git -C "$REPO" checkout --quiet -B "$DEPLOY_BRANCH" "origin/${DEPLOY_BRANCH}" 2>/dev/null || true
  git -C "$REPO" reset --hard --quiet "origin/${DEPLOY_BRANCH}"
  ok "repo already present, reset to origin/${DEPLOY_BRANCH} at $(git -C "$REPO" rev-parse --short HEAD)"
else
  git clone --quiet --branch "$DEPLOY_BRANCH" "$DEPLOY_REPO_URL" "$REPO"
  ok "cloned into ${REPO}"
fi

# ──────────────────────────────────────────────────────────────────────────
#  5. PRODUCTION ENV
# ──────────────────────────────────────────────────────────────────────────

step "Preparing ${SHARED}/app.env"

if [[ -f $SHARED/app.env ]]; then
  ok "app.env already exists, leaving it alone"
elif [[ -f $REPO/.env.example ]]; then
  cp "$REPO/.env.example" "$SHARED/app.env"
  chmod 600 "$SHARED/app.env"
  warn "app.env seeded from .env.example, every value is still blank"
else
  cat > "$SHARED/app.env" <<'SKEL'
NODE_ENV=production
PORT=4060
SITE_URL=https://lucas.untethered4life.com
DATABASE_URL=
DIRECT_URL=
OPENAI_API_KEY=
DEVTO_KEY=
WAKATIME_API_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
GITHUB_READ_USER_TOKEN_PERSONAL=
GITHUB_READ_USER_TOKEN_WORK=
CONTACT_FORM_API_KEY=
BLOG_API_URL=
CRON_SECRET=
CRON_ENABLED=true
ADMIN_TOKEN=
TEMP_API_KEY=
NEXT_PUBLIC_ADMIN_PASSWORD=
SKEL
  chmod 600 "$SHARED/app.env"
  warn "no .env.example in the clone, wrote a blank skeleton instead"
fi
echo
echo "  It is read twice: by the deploy script during next build (so every"
echo "  NEXT_PUBLIC_* must be correct before a build) and by systemd at runtime."
echo "  systemd EnvironmentFile syntax: KEY=value, one per line, no 'export',"
echo "  no \$VAR expansion, quote any value containing spaces."

# ──────────────────────────────────────────────────────────────────────────
#  6. SYSTEMD UNIT
# ──────────────────────────────────────────────────────────────────────────

step "Installing the ${APP_SERVICE} unit"

TEMPLATE="$REPO/scripts/deploy/setup/profile-site.service"
if [[ ! -f $TEMPLATE ]]; then
  die "missing ${TEMPLATE}
        The clone is on origin/${DEPLOY_BRANCH} and that branch has no
        scripts/deploy/ yet. Commit and push it from the dev box, then re-run."
fi

UNIT_TMP="$(mktemp)"
sed -e "s|__USER__|${DEPLOY_USER}|g" \
    -e "s|__ROOT__|${DEPLOY_ROOT}|g" \
    -e "s|__NPM__|${NPM_BIN}|g" \
    -e "s|__NODEBIN__|${NODE_BIN_DIR}|g" \
    "$TEMPLATE" > "$UNIT_TMP"

sudo install -m 0644 "$UNIT_TMP" "/etc/systemd/system/${APP_SERVICE}.service"
rm -f "$UNIT_TMP"
sudo systemctl daemon-reload
sudo systemctl enable --quiet "$APP_SERVICE"
ok "installed and enabled, not started"

# ──────────────────────────────────────────────────────────────────────────
#  7. PASSWORDLESS RESTART
# ──────────────────────────────────────────────────────────────────────────

step "Granting ${DEPLOY_USER} passwordless control of ${APP_SERVICE}"

SYSTEMCTL="$(command -v systemctl)"
SUDOERS_TMP="$(mktemp)"
cat > "$SUDOERS_TMP" <<EOF
# Installed by scripts/deploy/setup/bootstrap.sh
# Scoped to this one unit so a deploy never needs an interactive password.
${DEPLOY_USER} ALL=(root) NOPASSWD: ${SYSTEMCTL} restart ${APP_SERVICE}, ${SYSTEMCTL} start ${APP_SERVICE}, ${SYSTEMCTL} stop ${APP_SERVICE}
EOF

if sudo visudo -cqf "$SUDOERS_TMP"; then
  sudo install -m 0440 "$SUDOERS_TMP" "/etc/sudoers.d/${APP_SERVICE}-deploy"
  ok "/etc/sudoers.d/${APP_SERVICE}-deploy"
else
  rm -f "$SUDOERS_TMP"
  die "generated sudoers file failed validation, nothing installed"
fi
rm -f "$SUDOERS_TMP"

# journalctl on a system unit needs group membership; without it `deploy.sh
# logs` comes back empty instead of erroring, which is the confusing failure.
if ! id -nG "$DEPLOY_USER" | grep -qw 'systemd-journal'; then
  sudo usermod -aG systemd-journal "$DEPLOY_USER"
  warn "added ${DEPLOY_USER} to systemd-journal, log out and back in for it to apply"
fi

# ──────────────────────────────────────────────────────────────────────────
#  DONE
# ──────────────────────────────────────────────────────────────────────────

cat <<EOF

${BOLD}Server is ready. Remaining steps, in order:${RESET}

  1. Fill in ${SHARED}/app.env
       DATABASE_URL / DIRECT_URL   postgresql://profile_db_user:...@localhost:5432/profile_site
                                   Both. schema.prisma declares directUrl and
                                   Prisma errors at generate time if it is unset.
       PORT                        4060
       NODE_ENV                    production
       SITE_URL                    https://lucas.untethered4life.com
       SPOTIFY_*                   carried over from the Render service
       CRON_SECRET                 must match what the cron POSTs with
       ADMIN_TOKEN                 read by src/middleware.ts
       NEXT_PUBLIC_ADMIN_PASSWORD  baked into the client bundle at build time

  2. From the dev box:  ./scripts/deploy/deploy.sh
     First deploy runs a full npm ci and next build, so give it time.

  3. Confirm locally before touching DNS:
       curl -I http://127.0.0.1:4060/

  4. Publish lucas.untethered4life.com on the existing TMServer tunnel.
     See scripts/deploy/setup/cloudflared-config.yml

EOF
