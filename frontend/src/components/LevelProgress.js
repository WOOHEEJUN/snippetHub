import React from 'react';
import { FaCrown, FaStar, FaTrophy } from 'react-icons/fa';
import '../css/LevelProgress.css';

function LevelProgress({ userLevel, userPoints }) {
  const levels = [
    { level: 1, name: 'BRONZE', minPoints: 0, maxPoints: 100, color: '#cd7f32' },
    { level: 2, name: 'SILVER', minPoints: 100, maxPoints: 500, color: '#c0c0c0' },
    { level: 3, name: 'GOLD', minPoints: 500, maxPoints: 1000, color: '#ffd700' },
    { level: 4, name: 'PLATINUM', minPoints: 1000, maxPoints: 2000, color: '#e5e4e2' },
    { level: 5, name: 'DIAMOND', minPoints: 2000, maxPoints: 999999, color: '#b9f2ff' }
  ];

  const getCurrentLevelInfo = () => {
    const currentLevel = levels.find(level => 
      userPoints >= level.minPoints && userPoints < level.maxPoints
    ) || levels[levels.length - 1];
    
    return currentLevel;
  };

  const getNextLevelInfo = () => {
    const currentLevel = getCurrentLevelInfo();
    const nextLevel = levels.find(level => level.level === currentLevel.level + 1);
    return nextLevel;
  };

  const getProgressPercentage = () => {
    const currentLevel = getCurrentLevelInfo();
    const nextLevel = getNextLevelInfo();
    
    if (!nextLevel) return 100; // 최고 레벨인 경우
    
    const currentLevelPoints = userPoints - currentLevel.minPoints;
    const pointsNeededForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
    
    return Math.min(100, (currentLevelPoints / pointsNeededForNextLevel) * 100);
  };

  const getLevelIcon = (levelName) => {
    switch (levelName) {
      case 'BRONZE':
        return <FaStar style={{ color: '#cd7f32' }} />;
      case 'SILVER':
        return <FaStar style={{ color: '#c0c0c0' }} />;
      case 'GOLD':
        return <FaTrophy style={{ color: '#ffd700' }} />;
      case 'PLATINUM':
        return <FaCrown style={{ color: '#e5e4e2' }} />;
      case 'DIAMOND':
        return <FaCrown style={{ color: '#b9f2ff' }} />;
      default:
        return <FaStar />;
    }
  };

  const currentLevel = getCurrentLevelInfo();
  const nextLevel = getNextLevelInfo();
  const progressPercentage = getProgressPercentage();
  const pointsToNextLevel = nextLevel ? nextLevel.minPoints - userPoints : 0;

  return (
    <div className="level-progress">
      <div className="level-header">
        <h3>🏆 레벨 정보</h3>
      </div>

      <div className="current-level-info">
        <div className="level-icon">
          {getLevelIcon(currentLevel.name)}
        </div>
        <div className="level-details">
          <div className="level-name">{currentLevel.name}</div>
          <div className="level-number">Level {currentLevel.level}</div>
          <div className="current-points">{userPoints} P</div>
        </div>
      </div>

      {nextLevel && (
        <div className="next-level-info">
          <div className="progress-section">
            <div className="progress-header">
              <span>다음 레벨: {nextLevel.name}</span>
              <span>{pointsToNextLevel} P 더 필요</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${progressPercentage}%`,
                  backgroundColor: currentLevel.color
                }}
              ></div>
            </div>
            <div className="progress-text">
              {Math.round(progressPercentage)}% 완료
            </div>
          </div>
        </div>
      )}

      {!nextLevel && (
        <div className="max-level-info">
          <div className="max-level-badge">
            <FaCrown style={{ color: '#b9f2ff', fontSize: '2rem' }} />
            <span>최고 레벨 달성!</span>
          </div>
        </div>
      )}

      <div className="level-benefits">
        <h4>🎁 현재 레벨 혜택</h4>
        <ul className="benefits-list">
          {currentLevel.level >= 1 && (
            <li>기본 기능 사용 가능</li>
          )}
          {currentLevel.level >= 2 && (
            <li>스니펫 공개/비공개 설정</li>
          )}
          {currentLevel.level >= 3 && (
            <li>AI 코드 평가 기능</li>
          )}
          {currentLevel.level >= 4 && (
            <li>AI 문제 생성 기능</li>
          )}
          {currentLevel.level >= 5 && (
            <li>모든 프리미엄 기능 사용</li>
          )}
        </ul>
      </div>

      {nextLevel && (
        <div className="next-level-benefits">
          <h4>🚀 다음 레벨 혜택</h4>
          <ul className="benefits-list">
            {nextLevel.level === 2 && (
              <li>스니펫 공개/비공개 설정</li>
            )}
            {nextLevel.level === 3 && (
              <li>AI 코드 평가 기능</li>
            )}
            {nextLevel.level === 4 && (
              <li>AI 문제 생성 기능</li>
            )}
            {nextLevel.level === 5 && (
              <li>모든 프리미엄 기능 사용</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default LevelProgress; 