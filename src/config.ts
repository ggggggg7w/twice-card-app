// 类型定义 - 使用 string 类型避免循环依赖
export interface RecognitionResult {
  member?: string;
  album?: string;
  cardType?: string;
  confidence: number;
  rawResponse: string;
  reasoning?: string;
}

export interface CardInfo {
  id?: string;
  member: string;
  album: string;
  cardType: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface RecognitionRecord {
  id?: string;
  cardInfo: CardInfo;
  originalImage: string;
  recognizedAt: string;
  userConfirmed: boolean;
}

// 应用配置
export const config = {
  // Kimi API 配置
  kimi: {
    apiKey: import.meta.env.VITE_KIMI_API_KEY || '',
    apiUrl: import.meta.env.VITE_KIMI_API_URL || 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k-vision-preview',
  },
  
  // 飞书 Bitable 配置
  feishu: {
    appToken: import.meta.env.VITE_FEISHU_APP_TOKEN || 'PbcKb128ka18cbsfT6DckIvXnnd',
    tables: {
      cardInfo: 'tbl29r9YQwKsFjKd',      // 卡片信息表
      collection: 'tbl1vPILShWrJC3K',    // 我的收藏表
      wishlist: 'tbl4M6GRXK88hcZ9',      // 愿望清单表
      recognition: 'tbl6bRdmQFYZVS7s',   // 识别记录表
    },
  },
  
  // 应用配置
  app: {
    name: 'TWICE 小卡识别',
    version: '1.0.0',
  },
};

// TWICE 成员列表
export const TWICE_MEMBERS = [
  '娜琏', '定延', 'Momo', 'Sana', '志效', 
  'Mina', '多贤', '彩瑛', '子瑜'
] as const;

// 专辑列表（常见专辑）
export const TWICE_ALBUMS = [
  'THE STORY BEGINS',
  'PAGE TWO',
  'TWICEcoaster: LANE 1',
  'TWICEcoaster: LANE 2',
  'SIGNAL',
  'Twicetagram',
  'Merry & Happy',
  'What is Love?',
  'Summer Nights',
  'YES or YES',
  'The year of "Yes"',
  'FANCY YOU',
  'Feel Special',
  'MORE & MORE',
  'Eyes wide open',
  'Taste of Love',
  'Formula of Love: O+T=<3',
  'BETWEEN 1&2',
  'READY TO BE',
  'With YOU-th',
] as const;

// 卡片类型
export const CARD_TYPES = [
  '专辑卡',
  '特典卡',
  '签售卡',
  '周边卡',
  '会员礼',
  '随机卡',
  '台历卡',
  'DVD卡',
  '其他',
] as const;

export type Member = typeof TWICE_MEMBERS[number];
export type Album = typeof TWICE_ALBUMS[number];
export type CardType = typeof CARD_TYPES[number];
