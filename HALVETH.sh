#!/usr/bin/env bash
set -euo pipefail
task_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec "${HALVETH_NODE:-node}" "$task_root/scripts/halveth-entry.mjs" "$@"
