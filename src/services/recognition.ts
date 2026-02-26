import { config, RecognitionResult, CardInfo, TWICE_MEMBERS, TWICE_ALBUMS, CARD_TYPES } from '../config';

const API_BASE_URL = ''; // 使用相对路径，同源部署

/**
 * 使用后端 API 识别图片中的小卡信息
 */
export async function recognizeCard(imageBase64: string): Promise<RecognitionResult> {
  const prompt = `你是一位专业的 TWICE 小卡鉴定专家。请仔细分析这张小卡图片，识别以下信息：

## 第一步：识别成员
请仔细观察照片中人物的以下特征：
- **脸型**：圆脸、瓜子脸、方脸、鹅蛋脸等
- **发型**：长发、短发、直发、卷发、刘海样式、发色
- **五官**：眼睛形状（大眼/细长眼）、鼻子（高挺/小巧）、嘴唇（厚/薄）、眉毛形状
- **整体气质**：甜美、冷艳、活泼、优雅等

TWICE 九位成员的特征参考：
- **娜琏**：标志性兔牙，甜美笑容，常为大眼妆容
- **定延**：短发造型较多，英气五官，轮廓分明
- **Momo**：日系甜美女团风格，舞蹈担当，表情管理丰富
- **Sana**：大阪甜心，撒娇担当，笑容极具感染力，眼睛弯弯
- **志效**：队长，大气五官，成熟稳重气质，嗓音辨识度高
- **Mina**：芭蕾气质，优雅端庄，天鹅颈，清冷美感
- **多贤**：白皙皮肤，单眼皮/内双，活泼可爱，综艺感强
- **彩瑛**：个性鲜明，时尚前卫，短发造型多，独特魅力
- **子瑜**：身高最高，门面担当，端庄大气，五官精致立体

请对比以上特征，选择最匹配的成员。

## 第二步：识别专辑
观察小卡的整体设计风格、色调、背景元素，判断来自哪张专辑。
TWICE 主要专辑：${TWICE_ALBUMS.join('、')}

如果无法确定具体专辑，可以根据风格推测：
- 早期（2015-2017）：清新甜美、校园风
- 中期（2018-2020）：成熟转型、多彩风格
- 近期（2021-2024）：成熟优雅、多元概念

## 第三步：识别卡片类型
根据卡片材质、工艺、边框设计判断：
- **专辑卡**：随专辑附赠，标准尺寸，普通印刷
- **特典卡**：预售礼或平台特典，可能有特殊工艺（闪卡、镭射等）
- **签售卡**：线下签售活动卡，通常有特定标记
- **周边卡**：官方周边附赠，如台历、DVD等
- **会员礼**：官方会员专属卡片
- **随机卡**：随机卡包抽取

## 输出格式
请以 JSON 格式返回，必须包含以下字段：
{
  "member": "成员名称（必须从九人名单中选）",
  "album": "专辑名称（从列表中选或写'未知'）",
  "cardType": "卡片类型（从列表中选）",
  "confidence": 0.85,
  "reasoning": "简要说明识别依据，如'根据圆脸和兔牙特征判断为娜琏'"
}

confidence 说明：
- 0.9-1.0：非常确定，特征明显
- 0.7-0.9：比较确定，但有个别特征不太明显
- 0.5-0.7：不太确定，可能是该成员
- 0.0-0.5：无法确定

请仔细对比后再给出答案，不要急于下结论。`;

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
      reasoning: result.reasoning || '',
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
