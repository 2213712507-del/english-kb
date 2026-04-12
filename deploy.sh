#!/bin/bash
# 部署脚本 - 使用 npx vercel 无需全局安装

cd "$(dirname "$0")"

echo "🚀 正在部署到 Vercel..."
echo ""

# 使用 npx 运行 vercel，无需 sudo
npx vercel --yes --prod

echo ""
echo "✅ 部署完成！"
