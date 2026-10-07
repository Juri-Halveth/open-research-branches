#!/bin/sh
set -eu
task_root=$(CDPATH= cd -P "$(dirname "$0")" && pwd)
exec "${HALVETH_NODE:-node}" "$task_root/scripts/halveth-entry.mjs" "$@"
