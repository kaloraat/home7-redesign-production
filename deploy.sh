#!/bin/bash
# Runs ON the droplet — either by hand (`./deploy.sh`) or triggered remotely
# by .github/workflows/deploy.yml on every push to main. Deliberately does
# NOT touch .env.local: that file is gitignored on purpose (secrets should
# never live in git, and local/production legitimately need different
# values) and is edited by hand on the server when it needs to change — see
# the comment at the bottom of this file for exactly when that's required.
set -e

cd ~/home7-redesign

echo "==> Pulling latest code"
git pull origin main

# npm ci (not npm install) reads package-lock.json as the source of truth —
# this is what picks up any newly added dependency automatically, as long
# as the updated lockfile was committed alongside the code that needs it.
echo "==> Installing dependencies"
npm ci

echo "==> Building"
npm run build

echo "==> Restarting"
pm2 restart home7

echo "==> Done"

# --- Env vars: the one thing this script never touches ---
#
# .env.local lives only on the server (and your own machine), never in git.
# Two different situations:
#
# 1. Changing an EXISTING value (e.g. rotating an API key): edit it here
#    (`nano .env.local`), then `pm2 restart home7` — no code deploy needed.
#
# 2. A new feature needs a BRAND NEW env var: add it to .env.local here
#    manually before (or right after) that code lands — a deploy that
#    references a var that was never set on the server will either throw at
#    runtime or silently behave as if it's empty, depending on how that
#    variable's read. If it's a NEXT_PUBLIC_* var specifically, it's baked
#    into the client bundle at BUILD time, so it needs a real `npm run
#    build` (not just a restart) to actually take effect — which this
#    script already always does, so as long as .env.local is updated
#    *before* the next deploy runs, everything picks it up correctly
#    regardless of whether that deploy was triggered by hand or by a push.
#
# Nothing about the auto-deploy below changes any of this — it only ever
# automates the "pull code, npm ci, build, restart" part.
