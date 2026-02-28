import { RecognitionResult } from '../config';
import cardDatabase from '../data/cardDatabase.json';

const API_BASE_URL = '';

/**
 * 获取图鉴数据库信息用于提示词
 */
function getCardDatabaseInfo(): string {
  const db = cardDatabase as any;
  let info = `## 图鉴数据库\n\n`;
  
  // 专辑列表
  db.albums.forEach((album: any) => {
    info += `**${album.album}** (${album.colorScheme})\n`;
    album.versions.forEach((v: any) => {
      info += `  - ${v.version}：${v.cardType}，${v.colorScheme}\n`;
    });
    info += '\n';
  });
  
  // 成员特征
  info += '## 成员关键特征\n';
  Object.entries(db.memberKeyFeatures).forEach(([member, features]: [string, any]) => {
    info += `- **${member}**：${features.join('、')}\n`;
  });
  
  // 卡片类型定义
  info += '\n## 卡片类型识别指南\n';
  Object.entries(db.cardTypeDefinitions).forEach(([type, data]: [string, any]) => {
    info += `**${type}**：${data.description}\n`;
    info += `- 特征：${data.features.join('、')}\n`;
  });
  
  return info;
}

/**
 * 识别小卡
 */
export async function recognizeCard(imageBase64: string): Promise<RecognitionResult> {
  const databaseInfo = getCardDatabaseInfo();
  
  const prompt = `你是一位专业的 TWICE 小卡鉴定专家。请分析这张小卡图片。

${databaseInfo}

## 识别任务（按优先级）

**第一步：判断卡片大类**
观察以下特征：
1. **是否有拍立得边框** → 拍立得卡
2. **是否有平台Logo**（MP/MK/BDM等）→ 特典卡
3. **是否有ONCE JAPAN标识** → 日周卡
4. **是否有日期/台历元素** → 周边卡（台历卡）
5. **是否有NEMO/电子专标识** → 电子专卡
6. **以上都没有** → 专辑卡

**第二步：判断专辑**
- 绿色系 → THIS IS FOR
- 红色系 → STRATEGY
- 蓝色海洋 → DIVE
- 十周年纪念 → TEN

**第三步：判断成员**
按显著特征：兔牙(娜琏) > 笑眼(Sana) > 短发(定延) > 皮肤白(多贤)

**第四步：判断具体版本**
参考图鉴中的版本列表

## 输出格式（严格JSON）

{
  "member": "成员名称（娜琏/定延/Momo/Sana/志效/Mina/多贤/彩瑛/子瑜）",
  "album": "专辑名称",
  "cardType": "卡片大类（专辑卡/特典卡/日周卡/周边卡/拍立得卡/电子专卡）",
  "cardSubType": "具体类型（如：平台特典卡/签售卡/满额卡/台历卡等）",
  "version": "版本名称",
  "platform": "平台（MP/MK/BDM等，如果是特典卡）",
  "confidence": 0.85,
  "reasoning": "识别依据：1.卡片类型判断 2.专辑判断 3.成员判断"
}

confidence评分：
- 0.9-1.0：卡片类型+专辑+成员都明确
- 0.7-0.9：两项明确，一项推测
- 0.5-0.7：只有一项明确
- <0.5：无法判断

请严格按步骤分析，给出最准确的判断。`;

  try {
    const response = await fetch(`${API_BASE_URL}/api/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '识别失败');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let result: Partial<RecognitionResult> = {};
    
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('JSON 解析失败');
      }
    }

    return {
      member: result.member || '未知',
      album: result.album || '未知',
      cardType: result.cardType || '未知',
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || '',
      rawResponse: content,
    };
  } catch (error) {
    console.error('识别失败:', error);
    throw error;
  }
}

export async function recognizeMultipleCards(imageBase64List: string[]): Promise<RecognitionResult[]> {
  const results: RecognitionResult[] = [];
  for (let i = 0; i < imageBase64List.length; i++) {
    try {
      const result = await recognizeCard(imageBase64List[i]);
      results.push(result);
    } catch (error) {
      results.push({
        member: '识别失败',
        album: '识别失败',
        cardType: '识别失败',
        confidence: 0,
        rawResponse: String(error),
      });
    }
  }
  return results;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function canvasToBase64(canvas: HTMLCanvasElement, quality: number = 0.9): string {
  return canvas.toDataURL('image/jpeg', quality);
}

export async function splitNineGrid(imageFile: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('无法创建 canvas 上下文'));
        return;
      }

      const cardWidth = Math.floor(img.width / 3);
      const cardHeight = Math.floor(img.height / 3);
      const base64List: string[] = [];
      
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          canvas.width = cardWidth;
          canvas.height = cardHeight;
          ctx.drawImage(img, col * cardWidth, row * cardHeight, cardWidth, cardHeight, 0, 0, cardWidth, cardHeight);
          base64List.push(canvasToBase64(canvas));
        }
      }
      
      URL.revokeObjectURL(url);
      resolve(base64List);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };
    
    img.src = url;
  });
}
