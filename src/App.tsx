import React, { useState } from 'react';
import CameraCapture from './components/CameraCapture';
import ImageUploader from './components/ImageUploader';
import RecognitionResult from './components/RecognitionResult';
import NineGridResult from './components/NineGridResult';
import LoadingOverlay from './components/LoadingOverlay';
import { recognizeCard, recognizeMultipleCards, splitNineGrid, fileToBase64 } from './services/recognition';
import { saveCardInfo, saveToCollection, localStorage } from './services/feishu';
import { RecognitionResult as RecognitionResultType, CardInfo } from './config';
import './App.css';

type Mode = 'home' | 'single' | 'ninegrid';
type Step = 'select' | 'capture' | 'result';

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

  // 选择模式
  const handleSelectMode = (selectedMode: Mode) => {
    setMode(selectedMode);
    setStep('capture');
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
  };

  // 处理单张图片上传
  const handleSingleUpload = async (imageBase64: string, file: File) => {
    setSingleImage(imageBase64);
    setIsLoading(true);
    setLoadingMessage('正在识别小卡...');
    
    try {
      // 提取 base64 数据（移除 data:image/xxx;base64, 前缀）
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
      // 切割九宫格
      const base64List = await splitNineGrid(file);
      setNineGridImages(base64List);
      
      // 批量识别
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
      // 使用本地存储模式（当飞书 API 不可用时）
      const cardId = localStorage.saveCardInfo(cardInfo);
      localStorage.saveToCollection(cardId);
      
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
        const cardId = localStorage.saveCardInfo(card);
        localStorage.saveToCollection(cardId);
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

  // 渲染首页
  const renderHome = () => (
    <div className="home-container">
      <div className="app-header">
        <div className="logo">💕</div>
        <h1>TWICE 小卡识别</h1>
        <p className="subtitle">智能识别，轻松管理你的小卡收藏</p>
      </div>

      <div className="mode-selection">
        <button
          className="mode-card"
          onClick={() => handleSelectMode('single')}
        >
          <div className="mode-icon">📸</div>
          <h3>单张识别</h3>
          <p>拍照或上传单张小卡进行识别</p>
        </button>

        <button
          className="mode-card"
          onClick={() => handleSelectMode('ninegrid')}
        >
          <div className="mode-icon">🎯</div>
          <h3>九宫格识别</h3>
          <p>上传图鉴截图，自动识别9张小卡</p>
        </button>
      </div>

      <div className="app-footer">
        <p>支持 TWICE 全员小卡识别</p>
      </div>
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
            <button
              className="capture-option-btn"
              onClick={() => setShowCamera(true)}
            >
              <span className="option-icon">📷</span>
              <span className="option-text">拍照</span>
            </button>

            <div className="divider"><span>或</span></div>

            <ImageUploader
              onUpload={handleSingleUpload}
              label="从相册选择"
            />
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

            <ImageUploader
              onUpload={handleNineGridUpload}
              label="上传九宫格截图"
            />
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
