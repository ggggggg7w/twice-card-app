import { config, RecognitionResult, CardInfo, TWICE_MEMBERS, TWICE_ALBUMS, CARD_TYPES } from '../config';

const API_BASE_URL = ''; // 使用相对路径，同源部署

/**
 * 使用后端 API 识别图片中的小卡信息
 */
export async function recognizeCard(imageBase64: string): Promise<RecognitionResult> {
  const prompt = `请识别这张 TWICE 小卡图片，分析以下信息：
1. 成员名称（从以下选项中选择最匹配的：${TWICE_MEMBERS.join('、')}）
2. 专辑名称（从以下选项中选择最匹配的：${TWICE_ALBUMS.join('、')}，如果没有匹配的选择"未知"）
3. 卡片类型（从以下选项中选择最匹配的：${CARD_TYPES.join('、')}）

请以 JSON 格式返回结果，格式如下：
{
  "member": "成员名称",
  "album": "专辑名称",
  "cardType": "卡片类型",
  "confidence": 0.95
}

confidence 是置信度，范围 0-1。如果无法确定某个字段，请使用"未知"。`;

  try {
    const response = await fetch(`${API_BASE_URL}/api/recognize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || '识别失败');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // 尝试从响应中提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let result: Partial<RecognitionResult> = {};
    
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('JSON 解析失败，使用原始响应');
      }
    }

    return {
      member: result.member || '未知',
      album: result.album || '未知',
      cardType: result.cardType || '未知',
      confidence: result.confidence || 0.5,
      rawResponse: content,
    };
  } catch (error) {
    console.error('识别失败:', error);
    throw error;
  }
}

/**
 * 批量识别多张图片
 */
export async function recognizeMultipleCards(imageBase64List: string[]): Promise<RecognitionResult[]> {
  const results: RecognitionResult[] = [];
  
  for (let i = 0; i < imageBase64List.length; i++) {
    try {
      const result = await recognizeCard(imageBase64List[i]);
      results.push(result);
    } catch (error) {
      console.error(`第 ${i + 1} 张图片识别失败:`, error);
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

/**
 * 将文件转换为 Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data:image/xxx;base64, 前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 将 Canvas 转换为 Base64
 */
export function canvasToBase64(canvas: HTMLCanvasElement, quality: number = 0.9): string {
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * 九宫格切割
 * 将一张包含 3x3 小卡的图片切割成 9 张单独的图片
 */
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

      const width = img.width;
      const height = img.height;
      
      // 计算每个小卡的尺寸
      const cardWidth = Math.floor(width / 3);
      const cardHeight = Math.floor(height / 3);
      
      const base64List: string[] = [];
      
      // 切割成 9 张图片
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          canvas.width = cardWidth;
          canvas.height = cardHeight;
          
          ctx.drawImage(
            img,
            col * cardWidth,
            row * cardHeight,
            cardWidth,
            cardHeight,
            0,
            0,
            cardWidth,
            cardHeight
          );
          
          const base64 = canvasToBase64(canvas);
          base64List.push(base64);
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
