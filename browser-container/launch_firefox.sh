#!/usr/bin/env bash
set -eu

mkdir -p "${DOWNLOAD_DIR}"

if [ ! -f "${HOME}/.mozilla/firefox/profiles.ini" ]; then
  mkdir -p "${HOME}/.mozilla/firefox/volatile.default"
  cat > "${HOME}/.mozilla/firefox/profiles.ini" <<EOF
[Profile0]
Name=volatile
IsRelative=1
Path=volatile.default
Default=1

[General]
StartWithLastProfile=1
Version=2
EOF
fi

exec firefox --new-instance --no-remote about:blank

