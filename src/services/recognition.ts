import { RecognitionResult } from '../config';
import cardDatabase from '../data/cardDatabase.json';

const API_BASE_URL = '';

/**
 * 提取图片特征（简化版，基于颜色分析）
 */
function extractImageFeatures(imageBase64: string): {
  dominantColor: string;
  brightness: number;
  hasBorder: boolean;
  style: string;
} {
  // 简化特征提取，实际应该用canvas分析
  // 这里先用启发式规则
  return {
    dominantColor: 'unknown',
    brightness: 0.5,
    hasBorder: false,
    style: 'unknown'
  };
}

/**
 * 计算图片特征和数据库的匹配度
 */
function matchWithDatabase(features: any): {
  matched: boolean;
  result?: RecognitionResult;
  similarity: number;
} {
  const db = cardDatabase as any;
  
  // 检查特殊事件（台历、快闪等）
  for (const event of db.specialEvents || []) {
    const colorMatch = checkColorMatch(features.dominantColor, event.colorScheme);
    const styleMatch = checkStyleMatch(features.style, event.visualFeatures);
    
    const similarity = (colorMatch + styleMatch) / 2;
    
    if (similarity > 0.8) {
      return {
        matched: true,
        similarity,
        result: {
          member: '需进一步识别',
          album: event.officialName || event.event,
          cardType: event.cardType,
          confidence: similarity,
          reasoning: `匹配数据库：${event.event}，相似度${Math.round(similarity * 100)}%`,
          rawResponse: ''
        }
      };
    }
  }
  
  return { matched: false, similarity: 0 };
}

/**
 * 颜色匹配检查
 */
function checkColorMatch(imageColor: string, schemeColor: string): number {
  const colorMap: Record<string, string[]> = {
    '绿色': ['green', 'lime', 'emerald'],
    '红色': ['red', 'crimson', 'maroon'],
    '蓝色': ['blue', 'navy', 'sky'],
    '黄色': ['yellow', 'gold', 'amber'],
    '紫色': ['purple', 'violet', 'magenta'],
    '粉色': ['pink', 'rose', 'salmon']
  };
  
  // 简化匹配逻辑
  if (schemeColor.includes(imageColor)) return 1.0;
  if (schemeColor.includes('浅色') && imageColor === 'light') return 0.9;
  return 0.3;
}

/**
 * 风格匹配检查
 */
function checkStyleMatch(imageStyle: string, visualFeatures: string[]): number {
  const styleKeywords = ['商务', '休闲', '冬季', '夏日', '复古', '现代'];
  let matchCount = 0;
  
  for (const feature of visualFeatures) {
    if (imageStyle.includes(feature) || feature.includes(imageStyle)) {
      matchCount++;
    }
  }
  
  return Math.min(matchCount / visualFeatures.length, 1.0);
}

/**
 * 识别小卡 - 数据库优先匹配
 */
export async function recognizeCard(imageBase64: string): Promise<RecognitionResult> {
  // 第一步：提取图片特征
  const features = extractImageFeatures(imageBase64);
  
  // 第二步：尝试数据库匹配
  const dbMatch = matchWithDatabase(features);
  
  if (dbMatch.matched && dbMatch.similarity > 0.85) {
    // 数据库高置信度匹配，直接返回
    console.log('数据库匹配成功，相似度:', dbMatch.similarity);
    return dbMatch.result!;
  }
  
  // 第三步：数据库匹配失败或低置信度，调用API
  console.log('数据库匹配失败或低置信度，调用API识别');
  return await callAPIForRecognition(imageBase64, dbMatch.similarity);
}

/**
 * 调用API进行识别
 */
async function callAPIForRecognition(imageBase64: string, dbSimilarity: number): Promise<RecognitionResult> {
  const db = cardDatabase as any;
  
  // 构建提示词，包含数据库参考
  let dbInfo = '已知图鉴信息：\n';
  
  // 添加特殊事件
  db.specialEvents?.forEach((event: any) => {
    dbInfo += `- ${event.event}：${event.colorScheme}，${event.cardType}\n`;
  });
  
  // 添加专辑信息
  db.albums?.forEach((album: any) => {
    dbInfo += `- ${album.album}：${album.colorScheme}\n`;
  });
  
  const prompt = `识别这张TWICE小卡。严格按照以下步骤：

**第一步：判断是否为冬季/雪景主题（最重要）**
观察图片中是否有以下特征：
- 背景有雪景、雪花、冬季元素
- 成员穿着毛衣、围巾、毛线帽、厚外套
- 整体色调偏暖（米色、棕色、红色格子）
- 如果有以上任一特征 → 来源一定是"冬日快闪"

**第二步：判断成员（看最显著特征）**
- 兔牙明显 → 娜琏
- 眼睛弯成月牙笑眼 → Sana  
- 短发英气 → 定延
- 皮肤最白 → 多贤
- 小V脸日系妆 → Momo
- 健康肤色大气 → 志效
- 天鹅颈优雅 → Mina
- 个性前卫/短发 → 彩瑛
- 五官精致端庄/身高最高 → 子瑜

**第三步：确定卡片类型**
- 有雪景/毛衣/围巾 → 满额卡（冬日快闪）

**必须返回JSON格式：**
{"member":"成员名","album":"冬日快闪","cardType":"满额卡","confidence":0.8,"reasoning":"识别依据：冬季特征+成员特征"}

注意：如果图片有冬季元素（雪景/毛衣/围巾），album必须是"冬日快闪"，不能是其他！

confidence: 0.9-1.0(很确定), 0.7-0.9(较确定), 0.5-0.7(不太确定), <0.5(不确定)`;

  try {
    const response = await fetch(`${API_BASE_URL}/api/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, prompt }),
    });

    if (!response.ok) {
      throw new Error('API调用失败');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let result: Partial<RecognitionResult> = {};
    
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('JSON解析失败');
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
