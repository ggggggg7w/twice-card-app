#!/bin/bash

# TWICE 小卡识别应用启动脚本

# 设置环境变量
export KIMI_API_KEY="${KIMI_API_KEY:-}"
export PORT="${PORT:-3000}"

# 检查 node_modules
if [ ! -d "node_modules" ]; then
  echo "正在安装依赖..."
  npm install --legacy-peer-deps
fi

# 构建前端
echo "正在构建前端..."
npm run build

# 启动服务器
echo "启动服务器..."
echo "访问地址: http://localhost:$PORT"
echo ""
echo "如需配置 Kimi API Key，请设置环境变量:"
echo "  export KIMI_API_KEY=your_api_key"
echo ""

node server.cjs
