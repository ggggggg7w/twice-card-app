# TWICE 小卡识别应用 - 项目总结

## 项目概述

成功创建了一个完整的 TWICE 小卡识别网页应用，支持手机端访问，具备单张识别和九宫格批量识别功能。

## 访问地址

- **本地访问**: http://localhost:3000
- **局域网访问**: http://101.126.86.218:3000

## 已实现功能

### 1. 单张识别模式
- 📸 支持相机拍照
- 📁 支持从相册上传
- 🤖 AI 自动识别成员、专辑、卡片类型
- ✏️ 支持手动编辑识别结果
- 💾 保存到本地收藏

### 2. 九宫格识别模式
- 🎯 上传图鉴截图
- ✂️ 自动切割成 9 张小卡
- 🔍 批量识别每张卡片
- ☑️ 可选择性保存识别结果

### 3. 数据管理
- 本地存储模式（浏览器 LocalStorage）
- 飞书 Bitable 集成接口（待配置 API 凭证）

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Express.js + Node.js
- **AI 识别**: Kimi 视觉模型 API
- **数据存储**: LocalStorage / 飞书 Bitable

## 项目结构

```
twice-card-app/
├── dist/                    # 构建输出目录
├── src/
│   ├── components/          # React 组件
│   │   ├── CameraCapture.tsx      # 相机拍照组件
│   │   ├── ImageUploader.tsx      # 图片上传组件
│   │   ├── RecognitionResult.tsx  # 单张识别结果
│   │   ├── NineGridResult.tsx     # 九宫格识别结果
│   │   └── LoadingOverlay.tsx     # 加载动画
│   ├── services/            # API 服务
│   │   ├── recognition.ts   # 图像识别服务
│   │   └── feishu.ts        # 飞书 API 服务
│   ├── config.ts            # 配置常量
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 入口文件
├── server.cjs               # Express 服务器
├── start.sh                 # 启动脚本
├── package.json             # 项目依赖
└── README.md                # 使用说明
```

## 如何运行

### 方式一：使用启动脚本
```bash
cd /root/.openclaw/workspace/twice-card-app
./start.sh
```

### 方式二：手动启动
```bash
cd /root/.openclaw/workspace/twice-card-app
npm run build
npm run server
```

### 方式三：开发模式
```bash
cd /root/.openclaw/workspace/twice-card-app
npm run dev
```

## 配置说明

### 环境变量
创建 `.env` 文件配置以下变量：

```env
# Kimi API 配置（用于图像识别）
KIMI_API_KEY=your_kimi_api_key_here

# 服务器端口（可选）
PORT=3000
```

### 飞书 Bitable 配置
已在代码中配置：
- App Token: `PbcKb128ka18cbsfT6DckIvXnnd`
- 卡片信息表: `tbl29r9YQwKsFjKd`
- 我的收藏表: `tbl1vPILShWrJC3K`
- 愿望清单表: `tbl4M6GRXK88hcZ9`
- 识别记录表: `tbl6bRdmQFYZVS7s`

## API 接口

### 识别接口
- `POST /api/recognize` - 单张图片识别
- `POST /api/recognize-batch` - 批量图片识别
- `GET /api/health` - 健康检查

## 注意事项

1. **Kimi API Key**: 需要配置有效的 API Key 才能使用图像识别功能
2. **移动端优化**: 应用针对手机浏览器进行了优化
3. **图片质量**: 建议使用清晰的小卡照片以获得更好的识别效果
4. **九宫格模式**: 请确保上传的截图包含完整的 3×3 小卡排列

## 后续优化建议

1. 添加用户登录功能，支持多用户数据隔离
2. 集成飞书 OAuth，实现自动同步到 Bitable
3. 添加小卡数据库，支持离线识别
4. 添加收藏管理界面，支持查看和编辑已保存的卡片
5. 添加愿望清单功能，标记想要收集的小卡
6. 优化识别算法，提高识别准确率

## 已知问题

1. 飞书 Bitable 集成需要配置应用凭证（App ID 和 App Secret）
2. 当前使用 LocalStorage 存储数据，浏览器清除数据会丢失
3. 九宫格切割算法假设图片是标准的 3×3 排列

## 许可证

MIT License
