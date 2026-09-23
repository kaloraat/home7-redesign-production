#!/bin/bash
# Runs ON the droplet, by hand: `./deploy.sh`, whenever you decide to deploy.
# No longer triggered automatically — GitHub Actions used to run this on
# every push to main, removed after an incident where an auto-triggered
# deploy's build hung and nothing was watching for that. Deliberately does
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

# Build into a throwaway directory (next.config.ts's `distDir` reads this
# env var), never into the live `.next` directly. `home7` (pm2, still
# running the OLD code) keeps reading the OLD `.next` untouched for the
# entire build — previously `npm run build` overwrote `.next` in place
# while the old process was still live and serving from it, which is what
# actually took the site down once: the running server hit files mid-write/
# deleted by the new build, independent of whether the build itself
# succeeded. Building elsewhere first removes that whole window.
echo "==> Building into .next-new"
rm -rf .next-new
# --kill-after=15: what actually caused tonight's outage — a Turbopack
# PostCSS worker (cmdline contains "turbopack-node") hung and never exited,
# left running as an orphaned process indefinitely since nothing was ever
# going to time it out. `timeout` sends SIGTERM at 5 minutes (way more than
# this build has ever taken) and SIGKILL 15s later if it's still alive.
# That alone only reaches the direct `npm` process, not grandchild workers
# turbopack spawns — the explicit pkill below is what actually sweeps up a
# hung worker like the one from tonight, regardless of which process
# `timeout` itself managed to kill.
if ! timeout --kill-after=15 300 env NEXT_DIST_DIR=.next-new npm run build; then
  echo "==> Build TIMED OUT or FAILED — cleaning up and aborting"
  pkill -9 -f "turbopack-node" 2>/dev/null || true
  rm -rf .next-new
  echo "==> Leaving the currently-running deployment untouched."
  exit 1
fi

# Belt-and-suspenders: `npm run build` can print its normal success summary
# and still exit 0 without every expected file landing (this is the exact
# failure that took the site down — build-manifest.json missing despite a
# clean-looking build log). Refuse to go anywhere near `pm2 restart` unless
# the file the running server actually needs is verifiably there.
if [ ! -s .next-new/build-manifest.json ]; then
  echo "==> Build verification FAILED — .next-new/build-manifest.json missing or empty"
  echo "==> Leaving the currently-running deployment untouched. Fix the build and re-run."
  rm -rf .next-new
  exit 1
fi
# ^ if you're reading this because it just fired: the currently-running
# site is untouched and still fine. Check the build output above this line.

# Atomic swap: back up the currently-live .next (for a rollback if the new
# one turns out broken at runtime, not just at build time), then rename the
# verified new build into place. `mv` on the same filesystem is a single
# directory-entry rename, not a file-by-file copy — no window where `.next`
# is a mix of old and new files for a request to land in.
echo "==> Swapping in the new build"
rm -rf .next-old
# `[ -d .next ] && mv ...` would look equivalent but isn't safe under
# `set -e`: if `.next` doesn't exist yet (a brand-new server with no prior
# build), the `[ -d .next ]` test itself "fails" and set -e treats that as
# a fatal error for the whole line, aborting the script right here even
# though "no previous build to back up" is a completely normal case, not
# an error.
if [ -d .next ]; then
  mv .next .next-old
fi
mv .next-new .next

echo "==> Restarting"
pm2 restart home7

# A build that succeeds and verifies can still be broken at runtime (a
# missing env var, a bad DB connection, etc. — none of which show up until
# the process actually starts serving requests). Give it a few seconds and
# a few tries rather than declaring success the instant `pm2 restart`
# returns, since the app takes a moment to boot.
echo "==> Health check"
healthy=0
for _ in 1 2 3 4 5; do
  sleep 2
  if curl -sf -o /dev/null "http://localhost:3000/"; then
    healthy=1
    break
  fi
done

if [ "$healthy" -ne 1 ]; then
  echo "==> Health check FAILED — rolling back to the previous build"
  rm -rf .next
  if [ -d .next-old ]; then
    mv .next-old .next
  fi
  pm2 restart home7
  echo "==> Rolled back. Site should be back on the previous version — check pm2 logs for what broke in the new one before retrying."
  exit 1
fi

# Only reachable once the new build is live AND confirmed actually serving
# requests — safe to drop the rollback copy.
rm -rf .next-old

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
# Nothing about the auto-deploy above changes any of this — it only ever
# automates the "pull code, npm ci, build, verify, swap, restart, health
# check" part.
