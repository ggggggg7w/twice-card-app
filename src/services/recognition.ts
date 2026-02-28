import { RecognitionResult } from '../config';
import cardDatabase from '../data/cardDatabase.json';

const API_BASE_URL = '';

/**
 * 识别小卡 - 简化版提示词
 */
export async function recognizeCard(imageBase64: string): Promise<RecognitionResult> {
  const db = cardDatabase as any;
  
  // 简化提示词，只给关键信息
  const prompt = `识别这张TWICE小卡。按以下步骤：

**成员识别（看最显著特征）：**
- 兔牙明显 → 娜琏
- 眼睛弯成月牙笑眼 → Sana  
- 短发英气 → 定延
- 皮肤最白 → 多贤
- 小V脸日系妆 → Momo
- 健康肤色大气 → 志效
- 天鹅颈优雅 → Mina
- 个性前卫 → 彩瑛
- 五官精致端庄 → 子瑜

**专辑/来源判断（看背景）：**
- 绿色 → THIS IS FOR
- 红色 → STRATEGY
- 蓝色海洋 → DIVE
- 冬季/雪景/毛衣 → 冬日快闪
- 浅色背景+西装/衬衫+商务风 → 2026日本台历

**卡片类型：**
- 拍立得边框 → 拍立得卡
- 有MP/MK/BDM等Logo → 平台特典卡
- ONCE JAPAN字样 → 日周卡
- 浅色简约+成员名字标识 → 台历卡
- 以上都没有 → 专辑卡

**必须返回JSON格式：**
{"member":"成员名","album":"专辑名","cardType":"卡片类型","confidence":0.8,"reasoning":"识别依据"}

confidence: 0.9-1.0(很确定), 0.7-0.9(较确定), 0.5-0.7(不太确定), <0.5(不确定)`;

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
    
    // 提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let result: Partial<RecognitionResult> = {};
    
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('JSON解析失败，内容:', content);
      }
    }

    return {
      member: result.member || '未知',
      album: result.album || '未知',
      cardType: result.cardType || '未知',
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || content.substring(0, 100),
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
