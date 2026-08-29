#!/usr/bin/env bash

set -euo pipefail

readonly repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly product_slug="friend-file-drop"
readonly static_app_name="sf-friend-file-drop"
readonly resource_group="sociobot"
readonly live_url="https://friend-file-drop.sociobot.in"

cd "${repo_root}"

if [[ -n "$(git status --porcelain --untracked-files=normal)" ]]; then
  echo "Deployment refused: commit every source change before deploying." >&2
  exit 1
fi

readonly candidate_revision="$(git rev-parse HEAD)"
if [[ ! "${candidate_revision}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Deployment refused: HEAD is not a full lowercase commit SHA." >&2
  exit 1
fi

readonly branch_name="$(git symbolic-ref --quiet --short HEAD)"
readonly remote_revision="$(git ls-remote --exit-code origin "refs/heads/${branch_name}" | awk '{print $1}')"
if [[ "${remote_revision}" != "${candidate_revision}" ]]; then
  echo "Deployment refused: origin/${branch_name} is not candidate ${candidate_revision}." >&2
  exit 1
fi

npm run build
/opt/fleet/lib/deploy-static.sh "${product_slug}" "${repo_root}/dist"

az staticwebapp appsettings set \
  --name "${static_app_name}" \
  --resource-group "${resource_group}" \
  --setting-names "FRIEND_FILE_DROP_SOURCE_REVISION=${candidate_revision}" \
  --output none

node "${repo_root}/scripts/verify-live-identity.mjs" "${live_url}" "${candidate_revision}"
