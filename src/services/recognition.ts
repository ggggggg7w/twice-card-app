import { RecognitionResult } from '../config';
import cardDatabase from '../data/cardDatabase.json';

const API_BASE_URL = '';

/**
 * 获取图鉴数据库信息用于提示词
 */
function getCardDatabaseInfo(): string {
  const db = cardDatabase as any;
  let info = `## 已知图鉴参考（${db.album} 专辑）\n\n`;
  
  db.versions.forEach((version: any) => {
    info += `**${version.version}** (${version.colorScheme})\n`;
    info += `- 类型：${version.cardType}\n`;
  });
  
  info += '\n## 成员关键特征速查\n';
  Object.entries(db.memberKeyFeatures).forEach(([member, features]: [string, any]) => {
    info += `- **${member}**：${features.join('、')}\n`;
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

## 识别任务

1. **背景颜色/边框**：绿色/蓝色/黄色/紫色？
2. **卡片类型**：标准专辑卡、拍立得样式？
3. **成员特征**：
   - 最显著特征：兔牙？笑眼？短发？皮肤白？
   - 对比图鉴中该成员的特征

## 专辑判断（THIS IS FOR）
- 绿色背景 → REGULAR 或 POLAROID FOR
- 蓝色背景 → POLAROID THIS
- 黄色背景 → POLAROID IS
- 紫色/粉色 → DIGIPACK
- 彩带元素 → CONFETTI

## 输出格式（严格JSON）

{"member":"成员名称","album":"专辑名称","cardType":"卡片类型","version":"版本","confidence":0.85,"reasoning":"识别依据"}

confidence：0.9-1.0（背景+特征都匹配）、0.7-0.9（较确定）、0.5-0.7（不太确定）、<0.5（无法判断）`;

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
