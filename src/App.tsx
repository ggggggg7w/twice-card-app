import React, { useState, useEffect } from 'react';
import CameraCapture from './components/CameraCapture';
import ImageUploader from './components/ImageUploader';
import RecognitionResult from './components/RecognitionResult';
import NineGridResult from './components/NineGridResult';
import LoadingOverlay from './components/LoadingOverlay';
import { recognizeCard, recognizeMultipleCards, splitNineGrid, fileToBase64 } from './services/recognition';
import { saveCardInfo, saveToCollection, localStorage as feishuStorage } from './services/feishu';
import { RecognitionResult as RecognitionResultType, CardInfo } from './config';
import './App.css';

type Mode = 'home' | 'single' | 'ninegrid' | 'collection' | 'history' | 'wishlist';
type Step = 'select' | 'capture' | 'result';

interface CollectionItem {
  cardId: string;
  note?: string;
  collectedAt: string;
}

interface CardWithCollection extends CardInfo {
  id: string;
  createdAt: string;
  collectionNote?: string;
  collectedAt?: string;
}

function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [step, setStep] = useState<Step>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(0);
  
  // 单张识别状态
  const [singleImage, setSingleImage] = useState<string | null>(null);
  const [singleResult, setSingleResult] = useState<RecognitionResultType | null>(null);
  
  // 九宫格识别状态
  const [nineGridImages, setNineGridImages] = useState<string[]>([]);
  const [nineGridResults, setNineGridResults] = useState<RecognitionResultType[]>([]);
  
  // 显示相机
  const [showCamera, setShowCamera] = useState(false);

  // 收藏和历史数据
  const [collection, setCollection] = useState<CardWithCollection[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'collection' | 'history' | 'wishlist'>('collection');

  // 加载本地数据
  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = () => {
    const cards = JSON.parse(window.localStorage.getItem('cards') || '[]');
    const collections: CollectionItem[] = JSON.parse(window.localStorage.getItem('collections') || '[]');
    const records = JSON.parse(window.localStorage.getItem('recognitionRecords') || '[]');
    const wishes = JSON.parse(window.localStorage.getItem('wishlist') || '[]');

    // 合并卡片和收藏信息
    const collectionWithDetails = collections.map((col: CollectionItem) => {
      const card = cards.find((c: any) => c.id === col.cardId);
      return card ? { ...card, collectionNote: col.note, collectedAt: col.collectedAt } : null;
    }).filter(Boolean);

    setCollection(collectionWithDetails);
    setHistory(records.reverse()); // 最新的在前面
    setWishlist(wishes.reverse());
  };

  // 选择模式
  const handleSelectMode = (selectedMode: Mode) => {
    setMode(selectedMode);
    if (selectedMode === 'single' || selectedMode === 'ninegrid') {
      setStep('capture');
    }
    setSingleImage(null);
    setSingleResult(null);
    setNineGridImages([]);
    setNineGridResults([]);
  };

  // 返回首页
  const handleBackToHome = () => {
    setMode('home');
    setStep('select');
    setSingleImage(null);
    setSingleResult(null);
    setNineGridImages([]);
    setNineGridResults([]);
    loadLocalData(); // 刷新数据
  };

  // 处理单张图片上传
  const handleSingleUpload = async (imageBase64: string, file: File) => {
    setSingleImage(imageBase64);
    setIsLoading(true);
    setLoadingMessage('正在识别小卡...');
    
    try {
      const base64Data = imageBase64.split(',')[1];
      const result = await recognizeCard(base64Data);
      setSingleResult(result);
      setStep('result');
      
      // 保存识别记录
      const record = {
        type: 'single',
        imageBase64: imageBase64.substring(0, 100) + '...', // 只存前100字符
        result,
        timestamp: new Date().toISOString(),
      };
      const records = JSON.parse(window.localStorage.getItem('recognitionRecords') || '[]');
      records.push(record);
      window.localStorage.setItem('recognitionRecords', JSON.stringify(records));
    } catch (error) {
      console.error('识别失败:', error);
      alert('识别失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理相机拍照
  const handleCameraCapture = async (imageBase64: string) => {
    setShowCamera(false);
    setSingleImage(imageBase64);
    setIsLoading(true);
    setLoadingMessage('正在识别小卡...');
    
    try {
      const base64Data = imageBase64.split(',')[1];
      const result = await recognizeCard(base64Data);
      setSingleResult(result);
      setStep('result');
    } catch (error) {
      console.error('识别失败:', error);
      alert('识别失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理九宫格上传
  const handleNineGridUpload = async (imageBase64: string, file: File) => {
    setIsLoading(true);
    setLoadingMessage('正在切割九宫格...');
    
    try {
      const base64List = await splitNineGrid(file);
      setNineGridImages(base64List);
      
      setLoadingMessage('正在识别小卡...');
      setLoadingTotal(base64List.length);
      setLoadingProgress(0);
      
      const results: RecognitionResultType[] = [];
      for (let i = 0; i < base64List.length; i++) {
        setLoadingProgress(i + 1);
        setLoadingMessage(`正在识别第 ${i + 1}/${base64List.length} 张...`);
        
        try {
          const base64Data = base64List[i].split(',')[1];
          const result = await recognizeCard(base64Data);
          results.push(result);
        } catch (error) {
          console.error(`第 ${i + 1} 张识别失败:`, error);
          results.push({
            member: '识别失败',
            album: '识别失败',
            cardType: '识别失败',
            confidence: 0,
            rawResponse: String(error),
          });
        }
      }
      
      setNineGridResults(results);
      setStep('result');
      
      // 保存识别记录
      const record = {
        type: 'ninegrid',
        results: results.map(r => ({ member: r.member, album: r.album, cardType: r.cardType })),
        timestamp: new Date().toISOString(),
      };
      const records = JSON.parse(window.localStorage.getItem('recognitionRecords') || '[]');
      records.push(record);
      window.localStorage.setItem('recognitionRecords', JSON.stringify(records));
    } catch (error) {
      console.error('九宫格处理失败:', error);
      alert('九宫格处理失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
      setLoadingTotal(0);
    }
  };

  // 保存单张卡片
  const handleSaveSingle = async (cardInfo: CardInfo) => {
    setIsLoading(true);
    setLoadingMessage('正在保存...');
    
    try {
      const cardId = feishuStorage.saveCardInfo(cardInfo);
      feishuStorage.saveToCollection(cardId);
      
      alert('保存成功！');
      handleBackToHome();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  // 保存多张卡片
  const handleSaveMultiple = async (cards: CardInfo[]) => {
    setIsLoading(true);
    setLoadingMessage(`正在保存 ${cards.length} 张卡片...`);
    
    try {
      for (const card of cards) {
        const cardId = feishuStorage.saveCardInfo(card);
        feishuStorage.saveToCollection(cardId);
      }

      alert(`成功保存 ${cards.length} 张卡片！`);
      handleBackToHome();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  // 删除收藏
  const handleRemoveFromCollection = (cardId: string) => {
    if (!confirm('确定要从收藏中移除这张卡片吗？')) return;

    const collections = JSON.parse(window.localStorage.getItem('collections') || '[]');
    const updated = collections.filter((c: any) => c.cardId !== cardId);
    window.localStorage.setItem('collections', JSON.stringify(updated));
    loadLocalData();
  };

  // 渲染首页（包含收藏、历史、识别入口）
  const renderHome = () => (
    <div className="home-container">
      <div className="app-header">
        <div className="logo">💕</div>
        <h1>TWICE 小卡识别</h1>
        <p className="subtitle">智能识别，轻松管理你的小卡收藏</p>
      </div>

      {/* 快捷识别入口 */}
      <div className="quick-actions">
        <h3 className="section-title">🎯 快速识别</h3>
        <div className="mode-selection">
          <button className="mode-card" onClick={() => handleSelectMode('single')}>
            <div className="mode-icon">📸</div>
            <h3>单张识别</h3>
            <p>拍照或上传单张小卡</p>
          </button>

          <button className="mode-card" onClick={() => handleSelectMode('ninegrid')}>
            <div className="mode-icon">🎯</div>
            <h3>九宫格识别</h3>
            <p>上传图鉴截图识别9张</p>
          </button>
        </div>
      </div>

      {/* 数据统计 */}
      <div className="stats-bar">
        <div className="stat-item" onClick={() => { setActiveTab('collection'); setMode('collection'); }}>
          <span className="stat-number">{collection.length}</span>
          <span className="stat-label">我的收藏</span>
        </div>
        <div className="stat-item" onClick={() => { setActiveTab('history'); setMode('history'); }}>
          <span className="stat-number">{history.length}</span>
          <span className="stat-label">识别历史</span>
        </div>
        <div className="stat-item" onClick={() => { setActiveTab('wishlist'); setMode('wishlist'); }}>
          <span className="stat-number">{wishlist.length}</span>
          <span className="stat-label">愿望清单</span>
        </div>
      </div>

      {/* 我的收藏区域 - 始终显示 */}
      <div className="recent-section">
        <div className="section-header">
          <h3 className="section-title">⭐ 我的收藏</h3>
          <button className="view-all-btn" onClick={() => { setActiveTab('collection'); setMode('collection'); }}>
            {collection.length > 0 ? '查看全部 →' : '去添加 →'}
          </button>
        </div>
        {collection.length > 0 ? (
          <div className="recent-cards">
            {collection.slice(0, 5).map((card) => (
              <div key={card.id} className="mini-card" onClick={() => { setActiveTab('collection'); setMode('collection'); }}>
                <div className="mini-card-image">
                  {card.imageBase64 ? (
                    <img src={card.imageBase64} alt={card.member} />
                  ) : (
                    <div className="placeholder-image">🎴</div>
                  )}
                </div>
                <div className="mini-card-info">
                  <span className="mini-member">{card.member}</span>
                  <span className="mini-album">{card.album}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-hint" onClick={() => handleSelectMode('single')}>
            <div className="empty-hint-icon">📭</div>
            <p>还没有收藏卡片</p>
            <span className="empty-hint-action">点击识别第一张 →</span>
          </div>
        )}
      </div>

      {/* 识别历史区域 - 始终显示 */}
      <div className="recent-section">
        <div className="section-header">
          <h3 className="section-title">📝 识别历史</h3>
          <button className="view-all-btn" onClick={() => { setActiveTab('history'); setMode('history'); }}>
            {history.length > 0 ? '查看全部 →' : '去识别 →'}
          </button>
        </div>
        {history.length > 0 ? (
          <div className="recent-history">
            {history.slice(0, 3).map((record, idx) => (
              <div key={idx} className="history-item">
                <span className="history-type">{record.type === 'single' ? '单张' : '九宫格'}</span>
                <span className="history-time">{new Date(record.timestamp).toLocaleString('zh-CN')}</span>
                <span className="history-result">
                  {record.type === 'single' 
                    ? record.result?.member || '未知'
                    : `${record.results?.length || 0} 张卡片`
                  }
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-hint" onClick={() => handleSelectMode('single')}>
            <div className="empty-hint-icon">📝</div>
            <p>还没有识别记录</p>
            <span className="empty-hint-action">开始第一次识别 →</span>
          </div>
        )}
      </div>

      <div className="app-footer">
        <p>支持 TWICE 全员小卡识别</p>
      </div>
    </div>
  );

  // 渲染收藏页面
  const renderCollection = () => (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={handleBackToHome}>← 返回</button>
        <h2>我的收藏</h2>
        <span className="count-badge">{collection.length} 张</span>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'collection' ? 'active' : ''}`} onClick={() => setActiveTab('collection')}>收藏</button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setMode('history')}>历史</button>
        <button className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setMode('wishlist')}>愿望清单</button>
      </div>

      {collection.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>还没有收藏任何卡片</p>
          <button className="action-btn" onClick={() => handleSelectMode('single')}>去识别</button>
        </div>
      ) : (
        <div className="cards-grid">
          {collection.map((card) => (
            <div key={card.id} className="collection-card">
              <div className="card-image">
                {card.imageBase64 ? (
                  <img src={card.imageBase64} alt={card.member} />
                ) : (
                  <div className="placeholder-image">🎴</div>
                )}
              </div>
              <div className="card-details">
                <h4>{card.member}</h4>
                <p className="album">{card.album}</p>
                <p className="card-type">{card.cardType}</p>
                {card.collectionNote && <p className="note">💬 {card.collectionNote}</p>}
                <p className="date">📅 {new Date(card.collectedAt || card.createdAt).toLocaleDateString('zh-CN')}</p>
              </div>
              <button className="remove-btn" onClick={() => handleRemoveFromCollection(card.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染历史页面
  const renderHistory = () => (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={handleBackToHome}>← 返回</button>
        <h2>识别历史</h2>
        <span className="count-badge">{history.length} 条</span>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'collection' ? 'active' : ''}`} onClick={() => setMode('collection')}>收藏</button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>历史</button>
        <button className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setMode('wishlist')}>愿望清单</button>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>还没有识别记录</p>
          <button className="action-btn" onClick={() => handleSelectMode('single')}>去识别</button>
        </div>
      ) : (
        <div className="history-list">
          {history.map((record, idx) => (
            <div key={idx} className="history-card">
              <div className="history-header">
                <span className={`history-badge ${record.type}`}>
                  {record.type === 'single' ? '单张' : '九宫格'}
                </span>
                <span className="history-date">{new Date(record.timestamp).toLocaleString('zh-CN')}</span>
              </div>
              <div className="history-content">
                {record.type === 'single' ? (
                  <div className="single-result">
                    {record.imageBase64 && (
                      <img src={record.imageBase64.replace('...', '')} alt="识别图" className="history-thumb" />
                    )}
                    <div className="result-info">
                      <p><strong>成员:</strong> {record.result?.member || '未知'}</p>
                      <p><strong>专辑:</strong> {record.result?.album || '未知'}</p>
                      <p><strong>类型:</strong> {record.result?.cardType || '未知'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="ninegrid-result">
                    <p>识别了 {record.results?.length || 0} 张卡片</p>
                    <div className="mini-results">
                      {record.results?.slice(0, 6).map((r: any, i: number) => (
                        <span key={i} className="mini-tag">{r.member}</span>
                      ))}
                      {record.results?.length > 6 && <span className="mini-tag">+{record.results.length - 6}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染愿望清单页面
  const renderWishlist = () => (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={handleBackToHome}>← 返回</button>
        <h2>愿望清单</h2>
        <span className="count-badge">{wishlist.length} 个</span>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'collection' ? 'active' : ''}`} onClick={() => setMode('collection')}>收藏</button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setMode('history')}>历史</button>
        <button className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')}>愿望清单</button>
      </div>

      {wishlist.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💭</div>
          <p>愿望清单是空的</p>
          <p className="hint">识别卡片时可以添加到愿望清单</p>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((item, idx) => (
            <div key={idx} className="wishlist-card">
              <div className={`priority-badge priority-${item.priority}`}>{item.priority}</div>
              <p className="wish-card-id">{item.cardId}</p>
              {item.note && <p className="wish-note">{item.note}</p>}
              <p className="wish-date">{new Date(item.addedAt).toLocaleDateString('zh-CN')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 渲染单张识别界面
  const renderSingleMode = () => {
    if (step === 'capture') {
      return (
        <div className="capture-container">
          <div className="capture-header">
            <button className="back-btn" onClick={handleBackToHome}>← 返回</button>
            <h2>单张识别</h2>
          </div>

          <div className="capture-options">
            <button className="capture-option-btn" onClick={() => setShowCamera(true)}>
              <span className="option-icon">📷</span>
              <span className="option-text">拍照</span>
            </button>

            <div className="divider"><span>或</span></div>

            <ImageUploader onUpload={handleSingleUpload} label="从相册选择" />
          </div>
        </div>
      );
    }

    if (step === 'result' && singleResult && singleImage) {
      return (
        <div className="result-container">
          <div className="result-header-bar">
            <button className="back-btn" onClick={() => setStep('capture')}>← 返回</button>
            <h2>识别结果</h2>
          </div>

          <RecognitionResult
            result={singleResult}
            imageBase64={singleImage}
            onSave={handleSaveSingle}
            onCancel={() => setStep('capture')}
          />
        </div>
      );
    }

    return null;
  };

  // 渲染九宫格识别界面
  const renderNineGridMode = () => {
    if (step === 'capture') {
      return (
        <div className="capture-container">
          <div className="capture-header">
            <button className="back-btn" onClick={handleBackToHome}>← 返回</button>
            <h2>九宫格识别</h2>
          </div>

          <div className="capture-options">
            <div className="ninegrid-hint">
              <div className="hint-icon">💡</div>
              <p>请上传包含 3×3 小卡排列的图鉴截图</p>
            </div>

            <ImageUploader onUpload={handleNineGridUpload} label="上传九宫格截图" />
          </div>
        </div>
      );
    }

    if (step === 'result' && nineGridResults.length > 0) {
      return (
        <div className="result-container">
          <div className="result-header-bar">
            <button className="back-btn" onClick={() => setStep('capture')}>← 返回</button>
            <h2>识别结果</h2>
          </div>

          <NineGridResult
            results={nineGridResults}
            images={nineGridImages}
            onSave={handleSaveMultiple}
            onCancel={() => setStep('capture')}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="app">
      {mode === 'home' && renderHome()}
      {mode === 'single' && renderSingleMode()}
      {mode === 'ninegrid' && renderNineGridMode()}
      {mode === 'collection' && renderCollection()}
      {mode === 'history' && renderHistory()}
      {mode === 'wishlist' && renderWishlist()}

      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {isLoading && (
        <LoadingOverlay
          message={loadingMessage}
          progress={loadingTotal > 0 ? loadingProgress : undefined}
          total={loadingTotal > 0 ? loadingTotal : undefined}
        />
      )}
    </div>
  );
}

export default App;
