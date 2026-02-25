import { config, CardInfo, RecognitionRecord } from '../config';

const API_BASE_URL = ''; // 使用相对路径

/**
 * 保存卡片信息到 Bitable
 */
export async function saveCardInfo(cardInfo: CardInfo): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cardInfo),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '保存失败');
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('保存卡片信息失败:', error);
    throw error;
  }
}

/**
 * 保存到我的收藏
 */
export async function saveToCollection(cardId: string, note?: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardId, note }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '保存到收藏失败');
    }
  } catch (error) {
    console.error('保存到收藏失败:', error);
    throw error;
  }
}

/**
 * 保存到愿望清单
 */
export async function saveToWishlist(cardId: string, priority: string = '中', note?: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardId, priority, note }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '保存到愿望清单失败');
    }
  } catch (error) {
    console.error('保存到愿望清单失败:', error);
    throw error;
  }
}

/**
 * 保存识别记录
 */
export async function saveRecognitionRecord(record: RecognitionRecord): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recognition-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '保存识别记录失败');
    }
  } catch (error) {
    console.error('保存识别记录失败:', error);
    throw error;
  }
}

/**
 * 本地存储模式（当飞书 API 不可用时使用）
 */
export const localStorage = {
  saveCardInfo: (cardInfo: CardInfo): string => {
    const cards = JSON.parse(localStorage.getItem('cards') || '[]');
    const id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newCard = { ...cardInfo, id, createdAt: new Date().toISOString() };
    cards.push(newCard);
    localStorage.setItem('cards', JSON.stringify(cards));
    return id;
  },
  
  getCards: (): CardInfo[] => {
    return JSON.parse(localStorage.getItem('cards') || '[]');
  },
  
  saveToCollection: (cardId: string, note?: string): void => {
    const collections = JSON.parse(localStorage.getItem('collections') || '[]');
    collections.push({
      cardId,
      note,
      collectedAt: new Date().toISOString(),
    });
    localStorage.setItem('collections', JSON.stringify(collections));
  },
  
  saveToWishlist: (cardId: string, priority: string = '中', note?: string): void => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    wishlist.push({
      cardId,
      priority,
      note,
      addedAt: new Date().toISOString(),
    });
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  },
  
  saveRecognitionRecord: (record: RecognitionRecord): void => {
    const records = JSON.parse(localStorage.getItem('recognitionRecords') || '[]');
    records.push({
      ...record,
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
    localStorage.setItem('recognitionRecords', JSON.stringify(records));
  },
};
