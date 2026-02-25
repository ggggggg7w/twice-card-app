const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Kimi API 配置
const KIMI_API_KEY = process.env.KIMI_API_KEY || '';
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 识别小卡
app.post('/api/recognize', async (req, res) => {
  try {
    const { imageBase64, prompt } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: '缺少图片数据' });
    }

    if (!KIMI_API_KEY) {
      return res.status(500).json({ error: '服务器未配置 Kimi API Key' });
    }

    const response = await axios.post(
      KIMI_API_URL,
      {
        model: 'moonshot-v1-8k-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: prompt || '请识别这张 TWICE 小卡图片，分析成员名称、专辑名称和卡片类型。',
              },
            ],
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KIMI_API_KEY}`,
        },
        timeout: 60000,
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('识别失败:', error.response?.data || error.message);
    res.status(500).json({
      error: '识别失败',
      details: error.response?.data?.error?.message || error.message,
    });
  }
});

// 批量识别
app.post('/api/recognize-batch', async (req, res) => {
  try {
    const { images, prompt } = req.body;
    
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: '缺少图片数据' });
    }

    const results = [];
    for (const imageBase64 of images) {
      try {
        const response = await axios.post(
          KIMI_API_URL,
          {
            model: 'moonshot-v1-8k-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                    },
                  },
                  {
                    type: 'text',
                    text: prompt || '请识别这张 TWICE 小卡图片，分析成员名称、专辑名称和卡片类型。',
                  },
                ],
              },
            ],
            temperature: 0.3,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${KIMI_API_KEY}`,
            },
            timeout: 60000,
          }
        );
        results.push(response.data);
      } catch (error) {
        results.push({
          error: true,
          message: error.response?.data?.error?.message || error.message,
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('批量识别失败:', error.message);
    res.status(500).json({
      error: '批量识别失败',
      details: error.message,
    });
  }
});

// 所有其他路由返回 index.html（支持前端路由）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`Kimi API Key: ${KIMI_API_KEY ? '已配置' : '未配置'}`);
});
