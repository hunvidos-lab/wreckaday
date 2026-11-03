#!/bin/bash
set -euo pipefail
repo_path=$(cd "$(dirname "$0")/.." && pwd)
desktop_dir="${WRECKDAY_DESKTOP_DIR:-$HOME/Desktop}"
desktop_path="$desktop_dir/Wreckaday.command"
mkdir -p "$desktop_dir"
# %q produces valid zsh/bash quoting, including spaces and apostrophes in the path.
{
  printf '#!/bin/zsh\n'
  printf 'cd %q && exec bash scripts/dev-up.sh\n' "$repo_path"
} > "$desktop_path"
chmod +x "$desktop_path"
if [ -f "$repo_path/apps/mobile/assets/icon.png" ] && command -v fileicon >/dev/null 2>&1; then
  fileicon set "$desktop_path" "$repo_path/apps/mobile/assets/icon.png" >/dev/null 2>&1 || true
fi
echo "Created $desktop_path. Double-click it to start Wreckaday."
echo 'First launch blocked by macOS? Right-click → Open → Open.'
