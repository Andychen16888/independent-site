#!/usr/bin/env bash
# 一键安装 nginx 站点配置（自动替换域名、备份、校验、失败自动还原）。
#
# 为什么需要它：模板里的域名是占位符 your-domain.com，直接
#   sudo cp b2b-independent-site.nginx.conf /etc/nginx/sites-enabled/...
# 会写出带占位符的配置，nginx -t 直接报
#   cannot load certificate "/etc/letsencrypt/live/your-domain.com/fullchain.pem"
# 若此时机器重启，nginx 根本起不来，站点全挂。
#
# 用法：
#   bash scripts/install-nginx-conf.sh commoditychina.com
#
# 做了 5 件事：
#   1. 把模板里的 your-domain.com 全部替换成你的域名，并检查有没有漏掉的占位符
#   2. 备份现有配置（带时间戳），自动跟随 sites-available 的软链接
#   3. 写入新配置后先 nginx -t
#   4. 校验失败自动还原备份，绝不留下让 nginx 起不来的配置
#   5. 校验通过才 reload nginx

set -euo pipefail

DOMAIN="${1:-}"
TEMPLATE="b2b-independent-site.nginx.conf"
TARGET="/etc/nginx/sites-enabled/b2b-independent-site"

if [[ -z "$DOMAIN" ]]; then
  echo "用法: bash scripts/install-nginx-conf.sh <你的域名>" >&2
  echo "  例: bash scripts/install-nginx-conf.sh commoditychina.com" >&2
  exit 1
fi

if [[ ! -f "$TEMPLATE" ]]; then
  echo "[x] 当前目录找不到模板 $TEMPLATE，请在项目根目录 (/var/www/b2b-independent-site) 执行" >&2
  exit 1
fi

# sites-enabled 里通常是软链接，写入要落到真实文件，否则软链接会被 cp 覆盖掉
DEST="$TARGET"
if [[ -L "$TARGET" ]]; then
  DEST="$(readlink -f "$TARGET")"
  echo "[i] $TARGET 是软链接，实际写入 $DEST"
fi

TMP="$(mktemp /tmp/b2b-nginx-XXXXXX.conf)"
trap 'rm -f "$TMP"' EXIT
sed "s/your-domain\.com/${DOMAIN}/g" "$TEMPLATE" > "$TMP"

if grep -q "your-domain" "$TMP"; then
  echo "[x] 替换后仍有 your-domain 占位符，域名参数可能有误：$DOMAIN" >&2
  exit 1
fi
echo "[1/5] 已按域名 $DOMAIN 生成配置"

BACKUP=""
if sudo test -f "$DEST"; then
  BACKUP="$DEST.bak.$(date +%Y%m%d%H%M%S)"
  sudo cp "$DEST" "$BACKUP"
  echo "[2/5] 已备份旧配置 -> $BACKUP"
else
  echo "[2/5] 没有旧配置（首次部署），跳过备份"
fi

sudo cp "$TMP" "$DEST"

echo "[3/5] 校验配置"
if ! sudo nginx -t; then
  echo >&2
  echo "[x] nginx -t 失败，已停止安装" >&2
  if [[ -n "$BACKUP" ]]; then
    sudo cp "$BACKUP" "$DEST"
    echo "    已自动还原旧配置（备份在 $BACKUP）" >&2
  else
    echo "    没有旧配置可还原，请手动修正 $DEST" >&2
  fi
  exit 1
fi

echo "[4/5] 重新加载 nginx"
sudo systemctl reload nginx

echo "[5/5] 完成：https://$DOMAIN 已启用新配置"
echo "    备份文件 $BACKUP 可随时 sudo cp \"\$BACKUP\" $DEST 还原"