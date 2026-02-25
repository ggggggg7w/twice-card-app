import React, { useState } from 'react';
import { RecognitionResult, CardInfo } from '../config';
import './NineGridResult.css';

interface NineGridResultProps {
  results: RecognitionResult[];
  images: string[];
  onSave: (cards: CardInfo[]) => void;
  onCancel: () => void;
}

const NineGridResult: React.FC<NineGridResultProps> = ({
  results,
  images,
  onSave,
  onCancel,
}) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(
    results.map((_, i) => i)
  );

  const toggleSelection = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleSave = () => {
    const cards: CardInfo[] = selectedIndices.map((index) => ({
      member: results[index].member || '未知',
      album: results[index].album || '未知',
      cardType: results[index].cardType || '未知',
      imageUrl: images[index],
    }));
    onSave(cards);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.5) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className="nine-grid-result">
      <div className="grid-header">
        <h3>九宫格识别结果</h3>
        <p className="grid-subtitle">
          已选择 {selectedIndices.length} / {results.length} 张
        </p>
      </div>

      <div className="grid-results">
        {results.map((result, index) => (
          <div
            key={index}
            className={`grid-item ${selectedIndices.includes(index) ? 'selected' : ''}`}
            onClick={() => toggleSelection(index)}
          >
            <div className="grid-image">
              <img src={images[index]} alt={`Card ${index + 1}`} />
              <div className="selection-indicator">
                {selectedIndices.includes(index) ? '✓' : ''}
              </div>
            </div>
            
            <div className="grid-info">
              <div className="grid-member">{result.member || '未知'}</div>
              <div className="grid-album" title={result.album || '未知'}>
                {result.album || '未知'}
              </div>
              <div
                className="grid-confidence"
                style={{ color: getConfidenceColor(result.confidence) }}
              >
                {Math.round(result.confidence * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-actions">
        <button className="cancel-btn" onClick={onCancel}>
          取消
        </button>
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={selectedIndices.length === 0}
        >
          保存 {selectedIndices.length} 张到收藏
        </button>
      </div>
    </div>
  );
};

export default NineGridResult;
