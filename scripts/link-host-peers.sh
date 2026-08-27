#!/bin/zsh
# DeepSeek Harness 用 link: 安装本插件时，Node ESM 从源码真实路径解析依赖，
# 走不到 ~/.dsh/profiles/node_modules。这个脚本把 host 侧 peer 链回插件自己的 node_modules。
set -euo pipefail
PLUGIN_ROOT="${0:A:h:h}"
HOST_NM="${DSH_HOME:-$HOME/.dsh}/profiles/node_modules"
NM="$PLUGIN_ROOT/node_modules"

if [[ ! -d "$HOST_NM" ]]; then
  echo "link-host-peers: missing $HOST_NM" >&2
  exit 1
fi

python3 - "$PLUGIN_ROOT" "$HOST_NM" <<'PY'
import json, os, sys
from pathlib import Path
plugin = Path(sys.argv[1])
host = Path(sys.argv[2])
pkg = json.loads((plugin / "package.json").read_text())
nm = plugin / "node_modules"
nm.mkdir(exist_ok=True)

def link(name: str) -> None:
    src = host / name
    dst = nm / name
    if not src.exists():
        print(f"skip missing {name}")
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.is_symlink() or dst.is_file():
        dst.unlink()
    elif dst.exists():
        print(f"keep existing dir {dst}")
        return
    os.symlink(src, dst)
    print(f"link {name}")

for name in list(pkg.get("peerDependencies") or {}) + ["@earendil-works/pi-ai"]:
    link(name)
PY
