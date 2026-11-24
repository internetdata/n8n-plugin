#!/bin/bash

# Builds, lints and scans the node in a container, then runs it inside n8n's own image
# against https://api.internetdata.io: the keyless lookups always, and with
# INTERNETDATA_KEY set a keyed lookup, a bad address and a bad key. Every
# install, build and lint runs in a container: the dev dependencies are n8n's.
#
# n8n's lint looks for package.json from the file upwards and stops one level
# short of the root, so the repo is mounted two levels deep, never at /app. The
# scan runs with peers on: the repo's legacy-peer-deps would drop its n8n-workflow.

set -euo pipefail

NODE_IMAGE="node:24.15.0-bookworm"
N8N_IMAGE="n8nio/n8n:2.48.7"
PKG="n8n-nodes-internetdata"

main() {
    cd "$(dirname "$0")/.."
    local repo
    repo="$(pwd)"
    HOME_DIR="$(mktemp -d)"
    trap 'rm -rf "$HOME_DIR"' EXIT
    docker run --rm --memory 6g --cpus 4 -e CI=true -v "$repo":/work/n8n-plugin \
        -v "$repo/.git":/work/n8n-plugin/.git:ro -w /work/n8n-plugin \
        "$NODE_IMAGE" sh -c 'npm ci --ignore-scripts --no-audit --no-fund && npm run build && npm run lint &&
            npm_config_legacy_peer_deps=false npx -y @n8n/scan-community-package@0.44.0 /work/n8n-plugin'
    run_workflow "$repo" "$HOME_DIR" keyless e2eKeyless0001
    if [ -n "${INTERNETDATA_KEY:-}" ]; then
        run_workflow "$repo" "$HOME_DIR" keyed e2eKeyed000001
    else
        echo "skipped: keyed, INTERNETDATA_KEY is unset"
    fi
}

# Runs e2e/<kind>.json in a fresh n8n home with the package installed where n8n
# installs community nodes, then holds its output to e2e/check.mjs.
run_workflow() {
    local repo="$1" home="$2" kind="$3" id="$4"
    rm -rf "$home/n8n"
    mkdir -p "$home/n8n/nodes/node_modules/$PKG"
    chmod -R 777 "$home/n8n"
    local steps="n8n import:workflow --input=/home/node/.n8n/nodes/node_modules/$PKG/e2e/$kind.json"
    if [ "$kind" = "keyed" ]; then
        steps="printf '%s' \"\$CREDS\" > /tmp/creds.json && n8n import:credentials --input=/tmp/creds.json && $steps"
    fi
    steps="$steps && n8n execute --id=$id --rawOutput > /home/node/.n8n/$kind.out"
    docker run --rm --memory 4g --cpus 4 --entrypoint sh -e N8N_DIAGNOSTICS_ENABLED=false \
        -e CREDS="$(credentials)" -v "$home/n8n":/home/node/.n8n \
        -v "$repo":"/home/node/.n8n/nodes/node_modules/$PKG":ro "$N8N_IMAGE" -c "$steps"
    docker run --rm -v "$repo/e2e":/e2e:ro -v "$home/n8n":/out:ro "$NODE_IMAGE" \
        node /e2e/check.mjs "/out/$kind.out" "$kind"
}

# The keyed workflow's two credentials: the key under test, and one that is not.
credentials() {
    if [ -z "${INTERNETDATA_KEY:-}" ]; then
        return
    fi
    printf '[{"id":"e2eKey00000001","name":"InternetData key","type":"internetDataApi","data":{"apiKey":"%s"}},' \
        "$INTERNETDATA_KEY"
    printf '{"id":"e2eKey00000002","name":"Not a key","type":"internetDataApi","data":{"apiKey":"not-a-key"}}]'
}

main "$@"
