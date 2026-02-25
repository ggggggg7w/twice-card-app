# TWICE 小卡识别应用

一个基于 React + TypeScript 的手机端网页应用，用于识别 TWICE 小卡并保存到飞书 Bitable。

## 🌐 在线访问

**本地部署地址**: http://101.126.86.218:3000

## 功能特点

- 📸 拍照/上传小卡照片
- 🔍 单张识别模式：直接识别成员、专辑、卡类型
- 🎯 九宫格模式：上传图鉴截图，自动切割成9张分别识别
- 💾 识别结果展示，用户确认后保存到飞书 Bitable
- 🤖 使用 Kimi 视觉模型 API 进行图像识别

## 技术栈

- React 18 + TypeScript
- Vite 构建工具
- Express 后端服务器
- 移动端优先设计

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量（可选）

创建 `.env` 文件：

```env
# Kimi API 配置（用于图像识别）
# 从 https://platform.moonshot.cn/ 获取 API Key
KIMI_API_KEY=your_kimi_api_key_here

# 服务器端口（可选，默认 3000）
PORT=3000
```

### 3. 启动应用

使用启动脚本：
```bash
./start.sh
```

或手动启动：
```bash
npm run build
npm run server
```

### 4. 访问应用

- 本地访问: http://localhost:3000
- 局域网访问: http://你的IP:3000

## 飞书 Bitable 配置

### 连接信息
- **App Token**: `PbcKb128ka18cbsfT6DckIvXnnd`
- **卡片信息表**: `tbl29r9YQwKsFjKd`
- **我的收藏表**: `tbl1vPILShWrJC3K`
- **愿望清单表**: `tbl4M6GRXK88hcZ9`
- **识别记录表**: `tbl6bRdmQFYZVS7s`

### 表结构

#### 卡片信息表
- 成员名称
- 专辑名称
- 卡片类型
- 图片URL

#### 我的收藏表
- 卡片ID (关联卡片信息表)
- 收藏日期
- 备注

#### 愿望清单表
- 卡片ID (关联卡片信息表)
- 优先级
- 备注

#### 识别记录表
- 识别时间
- 识别结果
- 原始图片
- 用户确认状态

## 使用说明

1. **选择模式**: 打开应用后选择"单张识别"或"九宫格识别"
2. **上传图片**: 
   - 单张模式：拍照或从相册选择小卡照片
   - 九宫格模式：上传包含 3×3 小卡排列的图鉴截图
3. **等待识别**: AI 会自动分析图片内容
4. **查看结果**: 
   - 单张模式：显示成员、专辑、卡片类型
   - 九宫格模式：显示9张小卡的识别结果
5. **确认保存**: 检查识别结果，确认后保存到收藏

## 项目结构

```
twice-card-app/
├── dist/                  # 构建输出
├── src/
│   ├── components/        # React 组件
│   │   ├── CameraCapture.tsx    # 相机拍照
│   │   ├── ImageUploader.tsx    # 图片上传
│   │   ├── RecognitionResult.tsx # 识别结果
│   │   ├── NineGridResult.tsx   # 九宫格结果
│   │   └── LoadingOverlay.tsx   # 加载遮罩
│   ├── services/          # API 服务
│   │   ├── recognition.ts # 图像识别
│   │   └── feishu.ts      # 飞书 API
│   ├── config.ts          # 配置常量
│   ├── App.tsx            # 主应用
│   └── main.tsx           # 入口文件
├── server.cjs             # Express 服务器
├── start.sh               # 启动脚本
├── package.json
└── README.md
```

## API 接口

### POST /api/recognize
识别单张小卡

**请求体**:
```json
{
  "imageBase64": "data:image/jpeg;base64,...",
  "prompt": "识别提示词"
}
```

**响应**:
```json
{
  "choices": [{
    "message": {
      "content": "{\"member\":\"娜琏\",\"album\":\"READY TO BE\",\"cardType\":\"专辑卡\",\"confidence\":0.95}"
    }
  }]
}
```

### POST /api/recognize-batch
批量识别多张图片

### GET /api/health
健康检查

## 部署

### 本地部署

```bash
npm run build
npm run server
```

### 使用内网穿透

#### ngrok
```bash
npx ngrok http 3000
```

#### cloudflared
```bash
npx cloudflared tunnel --url http://localhost:3000
```

#### localtunnel
```bash
npx localtunnel --port 3000
```

### 生产环境部署

使用 PM2 管理进程：
```bash
npm install -g pm2
pm2 start server.cjs --name twice-card-app
```

## 注意事项

1. **Kimi API Key**: 如需使用图像识别功能，需要配置有效的 Kimi API Key
2. **移动端优化**: 应用针对移动设备进行了优化，建议在手机上使用
3. **图片质量**: 拍照时请确保光线充足，小卡清晰可见
4. **九宫格模式**: 请确保截图包含完整的 3×3 小卡排列

## 开发

### 开发模式
```bash
npm run dev
```

### 构建
```bash
npm run build
```

### 代码检查
```bash
npm run lint
```

## 许可证

MIT
