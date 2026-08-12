# Deploy

<!-- ═══════════════════════════════════════════════════════════════════ -->
## GOALS                                    <!-- 2026-08-12 -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

Ship this site from the dev box to the self-hosted server with one command, and make a bad deploy cost seconds instead of an evening. Every deploy is reversible, the live process is never touched until a new release has built, and the whole thing is legible enough to run at midnight without re-reading it.

Deliberately a near-copy of the `lir-app` pipeline at `/home/lucas/node/next/lir-app/scripts/deploy/`. Two apps on one box should fail the same way and be debugged the same way. Where this one differs, the difference is called out in RULES below rather than left to be discovered.

<!-- ═══════════════════════════════════════════════════════════════════ -->
## TOPOLOGY
<!-- ═══════════════════════════════════════════════════════════════════ -->

```
CommandCenter (WSL, dev)        192.168.1.113 (production)          Cloudflare
  deploy.sh  ──ssh bash -s──▶     remote-deploy.sh  (/home/geekom/node/profile_site)
                                    git fetch origin/main
                                    npm ci + prisma generate
                                    next build + next-sitemap
                                    switch `current` symlink         lucas.untethered4life.com
                                    systemctl restart profile-site ◀── cloudflared tunnel
                                    curl health gate                  (localhost:4060)
                                  Postgres (local, profile_site db)
```

The tunnel is `TMServer`, shared with `letitresolve.com`. This app is one more published route on it, not a new tunnel.

<!-- ═══════════════════════════════════════════════════════════════════ -->
## SERVER LAYOUT
<!-- ═══════════════════════════════════════════════════════════════════ -->

```
/home/geekom/node/profile_site/
├── repo/                       full clone, fetched at the top of every deploy
├── releases/
│   └── 00042-20260812-2024-a1b2c3d/   git worktree, immutable once built
├── current -> releases/00042-...      the symlink systemd resolves at start
└── shared/
    ├── app.env                 production env, build-time AND runtime
    ├── logs/                   DeployLog.log; the app itself logs to the journal
    └── uploads/images/         media written by pages/api/upload.ts
```

`DEPLOY_ROOT` in `deploy.env` holds the absolute path, never `~`. That file is sourced on the dev box, so a tilde would expand against the wrong home.

<!-- ═══════════════════════════════════════════════════════════════════ -->
## FILES
<!-- ═══════════════════════════════════════════════════════════════════ -->

### `deploy.sh`
Dev-box entry point. Reads `deploy.env`, warns about drift between the working tree and `origin/<branch>`, then pipes `remote-deploy.sh` over ssh and runs it with `bash -s`. Commands: `deploy` (default), `restart`, `rollback`, `status`, `logs [n|-f]`. Flags: `--branch`, `--force`, `--yes`.

### `remote-deploy.sh`
The whole deploy, executed on the server. Piped in over ssh rather than read from the server's checkout, so the logic that runs is always the copy in the working tree you invoked from. Also runnable directly on the server from `repo/scripts/deploy/`.

### `deploy.env.example`
Target configuration template. Copy to `deploy.env`, which is gitignored. Holds no secrets, only host, paths, branch, and timeouts.

### `setup/bootstrap.sh`
One-time server preparation, idempotent. Creates the layout, provisions a repo-scoped GitHub deploy key behind an ssh Host alias, clones the repo, installs the systemd unit, and grants passwordless `systemctl restart profile-site` scoped to that single unit. Never starts the app.

### `setup/profile-site.service`
systemd unit template. `__USER__`, `__ROOT__`, `__NPM__`, and `__NODEBIN__` are substituted by `bootstrap.sh`.

### `setup/cloudflared-config.yml`
Route reference plus the DNS prerequisites, including the nameserver check that has to pass before `untethered4life.com` can be routed at all.

<!-- ═══════════════════════════════════════════════════════════════════ -->
## RULES
<!-- ═══════════════════════════════════════════════════════════════════ -->

### The live release is never modified
A deploy builds into a brand new release directory. `current` moves only after `npm run build` has succeeded. Anything that fails before that point discards the new release and leaves the running app exactly where it was. This is the property to preserve if these scripts are ever restructured.

### Nothing gates the build except the build
`npm run build` here is `next build` followed by `next-sitemap`. There is no test suite in the path, so unlike `lir-app` a deploy proves only that the app compiles. A release that builds and serves `/` can still be broken. Adding tests would make this pipeline meaningfully safer and is the highest-value change available to it.

### Ordering comes from the sequence prefix, not the timestamp
Release directories are named `<seq>-<utc-stamp>-<sha>`. Rollback and prune both walk `list_releases`, and two deploys inside the same second would sort by sha if the timestamp were the only key, which hands back the wrong "previous" release and lets prune delete the newest one. The zero-padded sequence makes lexical order identical to deploy order. Do not reorder or drop that prefix.

### One env file, read twice
`shared/app.env` is symlinked to `.env.local` in each release so Next reads it during `next build`, and it is read by systemd as an `EnvironmentFile` at runtime. Both readings matter: `NEXT_PUBLIC_*` values bake into the client bundle at build time, so a change to one of them requires a rebuild, not just a restart. Keep the file in systemd `EnvironmentFile` syntax (`KEY=value`, no `export`, no `$VAR` expansion) because `load_env` tolerates that shape but the reverse is not true.

### The Prisma client is deploy state, not source
`prisma generate` writes into `node_modules`. When `install_deps` hardlinks the previous release's `node_modules` (lockfile unchanged), the client it inherits was generated from the PREVIOUS release's `schema.prisma`, and the inodes are shared with the running app. So the hardlink path deletes `node_modules/.prisma` first and regenerates. Never run `prisma generate` over a hardlinked tree without dropping those links: it rewrites files the live process has open.

### public/images is both an asset directory and an upload target
109 files are committed there; `pages/api/upload.ts` writes more at runtime. A symlink into `shared/` would hide the committed half, so the two are merged instead. Uploaded files are identified as the files git does not track, which works because a release is a git worktree. They are harvested into `shared/uploads/` before the switch and overlaid into each new release with `cp -n`, so a name that later becomes a committed asset wins over the older upload. On Render this directory was ephemeral and uploads were lost on every redeploy; here they persist.

### Its own deploy key, behind an ssh alias
GitHub binds a deploy key to exactly one repository, and the geekom's `~/.ssh/id_ed25519` is already the `lir-app` key. `bootstrap.sh` generates `~/.ssh/id_ed25519_profile_site` and writes a `Host github-profile-site` block with `IdentitiesOnly yes`, which is what stops ssh offering the lir-app key first. That is why `DEPLOY_REPO_URL` names `github-profile-site` and not `github.com`.

### Bash here, not TypeScript
These scripts run on the host before and after the app process exists, on a machine where the repo may not be installed yet, so they cannot depend on the app's toolchain. Test changes against a sandbox layout rather than against production.

<!-- ═══════════════════════════════════════════════════════════════════ -->
## TODO
<!-- ═══════════════════════════════════════════════════════════════════ -->

- [X] 2026-08-12 Restore the Render `template_2_db` dump into a local `profile_site` database on the geekom
- [ ] Commit and push `scripts/deploy/`, then run `setup/bootstrap.sh` on 192.168.1.113
- [ ] Add the generated `id_ed25519_profile_site.pub` as a deploy key on `LucasPMorris/profile_site`
- [ ] Fill in `shared/app.env`, carrying `SPOTIFY_*`, `CRON_SECRET`, and `ADMIN_TOKEN` over from Render
- [ ] First deploy, verified on the LAN at `http://192.168.1.113:4060/` before any DNS change
- [ ] Confirm `untethered4life.com` is on Cloudflare nameservers; recreate the Workspace MX and DKIM records in the Cloudflare zone BEFORE moving them
- [ ] Publish `lucas.untethered4life.com` on the TMServer tunnel and delete the Render record
- [ ] Watch the journal for the first Spotify ingestion run after cutover
- [ ] Retire the Render `profile-site` service, the last one left
- [ ] Add a test suite so `npm run build` gates on something more than compilation
- [ ] Completed
