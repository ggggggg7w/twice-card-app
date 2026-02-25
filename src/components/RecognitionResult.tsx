import React, { useState } from 'react';
import { RecognitionResult, CardInfo, TWICE_MEMBERS, TWICE_ALBUMS, CARD_TYPES } from '../config';
import './RecognitionResult.css';

interface RecognitionResultProps {
  result: RecognitionResult;
  imageBase64: string;
  onSave: (cardInfo: CardInfo) => void;
  onCancel: () => void;
}

const RecognitionResultComponent: React.FC<RecognitionResultProps> = ({
  result,
  imageBase64,
  onSave,
  onCancel,
}) => {
  const [member, setMember] = useState(result.member || '未知');
  const [album, setAlbum] = useState(result.album || '未知');
  const [cardType, setCardType] = useState(result.cardType || '未知');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    const cardInfo: CardInfo = {
      member,
      album,
      cardType,
      imageUrl: imageBase64,
    };
    onSave(cardInfo);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.5) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className="recognition-result">
      <div className="result-header">
        <h3>识别结果</h3>
        <div
          className="confidence-badge"
          style={{ backgroundColor: getConfidenceColor(result.confidence) }}
        >
          置信度: {Math.round(result.confidence * 100)}%
        </div>
      </div>

      <div className="result-image">
        <img src={imageBase64} alt="Card" />
      </div>

      <div className="result-details">
        {isEditing ? (
          <div className="edit-form">
            <div className="form-group">
              <label>成员</label>
              <select value={member} onChange={(e) => setMember(e.target.value)}>
                <option value="未知">未知</option>
                {TWICE_MEMBERS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>专辑</label>
              <select value={album} onChange={(e) => setAlbum(e.target.value)}>
                <option value="未知">未知</option>
                {TWICE_ALBUMS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>卡片类型</label>
              <select value={cardType} onChange={(e) => setCardType(e.target.value)}>
                <option value="未知">未知</option>
                {CARD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="result-info">
            <div className="info-item">
              <span className="info-label">成员:</span>
              <span className="info-value">{member}</span>
            </div>
            <div className="info-item">
              <span className="info-label">专辑:</span>
              <span className="info-value">{album}</span>
            </div>
            <div className="info-item">
              <span className="info-label">卡片类型:</span>
              <span className="info-value">{cardType}</span>
            </div>
          </div>
        )}

        <button
          className="edit-toggle-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? '完成编辑' : '编辑信息'}
        </button>
      </div>

      <div className="result-actions">
        <button className="cancel-btn" onClick={onCancel}>
          取消
        </button>
        <button className="save-btn" onClick={handleSave}>
          保存到收藏
        </button>
      </div>
    </div>
  );
};

export default RecognitionResultComponent;
