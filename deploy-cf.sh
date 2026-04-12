#!/bin/bash
# 使用 Cloudflare Pages API 部署

set -e

ACCOUNT_ID="4b66f19f8f4c1b2e6d9f8a3c1e4b7d2f"  # Cloudflare Account ID
PROJECT_NAME="english-kb"

# 创建 zip 文件
echo "📦 正在打包文件..."
zip -r /tmp/english-kb-deploy.zip . -x "*.git*" -x "node_modules/*" -x "*.md" -x "*.sh" -x "*.py" -x "*.lock" -x "deploy.sh"

# 获取上传 URL
echo "🔗 获取上传链接..."
RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/assets/upload" \
  -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}" \
  -H "X-Auth-Key: ${CLOUDFLARE_API_KEY}" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/tmp/english-kb-deploy.zip" \
  -F "metadata={\"\":{\"version\":\"$(date +%s)\"}}")

echo "$RESPONSE"
