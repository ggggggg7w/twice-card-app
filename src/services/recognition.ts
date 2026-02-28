import { config, RecognitionResult, CardInfo, TWICE_MEMBERS, TWICE_ALBUMS, CARD_TYPES } from '../config';

const API_BASE_URL = ''; // 使用相对路径，同源部署

/**
 * 使用后端 API 识别图片中的小卡信息
 */
export async function recognizeCard(imageBase64: string): Promise<RecognitionResult> {
  const prompt = `你是一位专业的 TWICE 小卡鉴定专家。请仔细分析这张小卡图片，识别以下信息。

## 成员识别指南（按辨识度排序）

请按以下顺序观察并排除：

**1. 娜琏 (Nayeon)**
- 最显著特征：上排门牙略向前突出（兔牙），笑起来非常明显
- 脸型：圆润的鹅蛋脸，苹果肌饱满
- 眼睛：大而圆，卧蚕明显，常画眼线拉长眼尾
- 发型：经常变换，但刘海造型较多

**2. 定延 (Jeongyeon)**
- 最显著特征：短发造型居多（队里短发担当），五官英气
- 脸型：偏长的鹅蛋脸，下颌线条清晰
- 气质：中性帅气，表情偏酷

**3. Momo**
- 最显著特征：日系妆容风格，眼妆较浓，下睫毛明显
- 脸型：小V脸，下巴尖
- 表情：丰富多变，经常wink或嘟嘴
- 身材：舞蹈担当，身材匀称

**4. Sana**
- 最显著特征：笑眼（眼睛弯成月牙形），极具感染力
- 脸型：鹅蛋脸，脸颊有肉感
- 表情：撒娇表情多，经常抿嘴笑
- 气质：甜美可爱，"大阪甜心"风格

**5. 志效 (Jihyo)**
- 最显著特征：健康的小麦肤色，五官立体大气
- 脸型：偏方圆脸，下颌角明显
- 眼睛：双眼皮宽，眼神坚定有力
- 气质：成熟稳重，队长气场

**6. Mina**
- 最显著特征：天鹅颈（脖子修长），芭蕾气质
- 脸型：鹅蛋脸，线条柔和
- 表情：微笑较含蓄，清冷优雅
- 整体：端庄、文静、有距离感的美

**7. 多贤 (Dahyun)**
- 最显著特征：皮肤非常白皙（队里最白），单眼皮/内双
- 脸型：鹅蛋脸，脸颊饱满
- 表情：活泼搞怪，综艺感强
- 其他：经常染浅发色（金发、浅棕等）

**8. 彩瑛 (Chaeyoung)**
- 最显著特征：个性前卫，短发造型多（尤其是金色短发）
- 脸型：小圆脸，下巴略尖
- 气质：时尚、独特、有艺术感
- 其他：有纹身（手臂内侧）

**9. 子瑜 (Tzuyu)**
- 最显著特征：身高最高（172cm），身材比例好
- 脸型：标准的鹅蛋脸，五官精致对称
- 眼睛：大而有神，双眼皮明显
- 气质：端庄大气，门面担当的优雅感

## 专辑识别指南

TWICE 主要专辑及视觉特征：

**早期（2015-2017）：清新甜美**
- THE STORY BEGINS (2015)：出道专，清纯校园风
- PAGE TWO (2016)：啦啦队风格，色彩鲜艳
- TWICEcoaster: LANE 1/2 (2016)：游乐园、梦幻风格
- SIGNAL (2017)：复古信号概念，粉紫色调

**转型期（2018-2020）：成熟多彩**
- What is Love? (2018)：电影致敬概念，复古可爱
- Summer Nights (2018)：夏日海滩风
- YES or YES (2018)：万圣节、魔法少女概念
- FANCY YOU (2019)：夏日水果、鲜艳色彩
- Feel Special (2019)：优雅华丽，金色调多
- MORE & MORE (2020)：热带花园、自然元素

**成熟期（2020-2024）：多元高级**
- Eyes wide open (2020)：复古优雅，深色调
- Taste of Love (2021)：夏日鸡尾酒、微醺感
- Formula of Love (2021)：实验室、理性概念
- BETWEEN 1&2 (2022)：黑白对比、成熟感
- READY TO BE (2023)：强势、自信、大女人风
- With YOU-th (2024)：青春回忆、温暖色调
- THIS IS FOR (2025)：十周年纪念，多元风格

## 卡片类型识别

- **专辑卡**：标准尺寸（约 5.5x8.5cm），普通印刷，无边框或简单边框
- **特典卡**：可能有闪膜、镭射、全息效果，平台Logo（如Ktown4u、MUSICPLANT等）
- **签售卡**：通常有"Fansign"或活动名称标记
- **周边卡**：台历卡（通常有日期）、DVD卡（有DVD封面元素）
- **会员礼**：ONCE JAPAN或官方会员标识
- **随机卡**：随机卡包抽取，通常有系列编号

## 输出格式（严格JSON）

你必须以JSON格式返回，不要添加任何其他文字：

{
  "member": "成员名称（必须是：娜琏/定延/Momo/Sana/志效/Mina/多贤/彩瑛/子瑜 之一）",
  "album": "专辑名称（从上述列表中选择最接近的，不确定写'未知'）",
  "cardType": "卡片类型（专辑卡/特典卡/签售卡/周边卡/会员礼/随机卡/未知）",
  "confidence": 0.85,
  "reasoning": "详细说明识别依据，列出2-3个关键特征"
}

confidence评分标准：
- 0.9-1.0：特征极其明显（如娜琏的兔牙、Sana的笑眼）
- 0.7-0.9：特征较明显，有把握
- 0.5-0.7：有一定特征但不太确定
- 0.0-0.5：无法判断或特征模糊

## 识别流程

1. 先看整体：判断是单人卡还是团体卡
2. 观察最显著特征：兔牙？笑眼？短发？白皙皮肤？
3. 对比排除：根据特征缩小到2-3个可能成员
4. 细节确认：看眼睛形状、脸型、气质做最终判断
5. 看背景和风格：判断专辑时期和卡片类型

请严格按照以上流程分析，给出最准确的判断。`;

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
