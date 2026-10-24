#!/bin/bash
# 发布到 npm：预检 → 发布 → 验证
set -e
cd "$(dirname "$0")/.."

REG=https://registry.npmjs.org/

echo "=== 1. 登录检查 ==="
if ! npm whoami --registry="$REG" >/dev/null 2>&1; then
  echo "未登录 npmjs。先运行： npm login --registry=$REG"
  exit 1
fi
echo "已登录: $(npm whoami --registry="$REG")"

NAME=$(node -e "console.log(require('./package.json').name)")
VERSION=$(node -e "console.log(require('./package.json').version)")
echo "包: $NAME@$VERSION"

echo
echo "=== 2. 包名占用检查 ==="
if npm view "$NAME" version --registry="$REG" >/dev/null 2>&1; then
  echo "包名已被占用：$NAME"
  echo "改用：node -e \"const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));p.name='magpie-chat';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\\n')\""
  exit 1
fi
echo "包名可用"

echo
echo "=== 3. 打包预检 ==="
npm pack --dry-run --registry="$REG" 2>&1 | tail -5

echo
echo "=== 4. 发布 ==="
npm publish --registry="$REG" --access public

echo
echo "=== 5. 验证 ==="
sleep 6
npm view "$NAME" version --registry="$REG"
echo "完成。装法：magpie plugin add $NAME"
