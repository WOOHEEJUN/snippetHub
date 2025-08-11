import React from 'react';
import { FaCrown, FaStar, FaTrophy } from 'react-icons/fa';
import '../css/LevelProgress.css';

function LevelProgress({ userLevel, userPoints }) {
  const levels = [
    { level: 1, name: 'BRONZE', minPoints: 0, maxPoints: 100, color: '#cd7f32' },
    { level: 2, name: 'SILVER', minPoints: 100, maxPoints: 500, color: '#c0c0c0' },
    { level: 3, name: 'GOLD', minPoints: 500, maxPoints: 1000, color: '#ffd700' },
    { level: 4, name: 'PLATINUM', minPoints: 1000, maxPoints: 2500, color: '#e5e4e2' },
    { level: 5, name: 'DIAMOND', minPoints: 2500, maxPoints: 5000, color: '#b9f2ff' },
    { level: 6, name: 'MASTER', minPoints: 5000, maxPoints: 10000, color: '#800080' },
    { level: 7, name: 'GRANDMASTER', minPoints: 10000, maxPoints: 20000, color: '#ff4500' },
    { level: 8, name: 'LEGEND', minPoints: 20000, maxPoints: Infinity, color: '#00bfff' }
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
      case 'MASTER':
        return <FaCrown style={{ color: '#9370db' }} />;
      case 'GRANDMASTER':
        return <FaCrown style={{ color: '#ff4500' }} />;
      case 'LEGEND':
        return <FaCrown style={{ color: '#00bfff' }} />;
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
                  backgroundColor: '#8ab0d1'
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
            <FaCrown style={{ color: '#ffd700', fontSize: '2rem' }} />
            <span>최고 레벨 달성!</span>
          </div>
        </div>
      )}

     
    </div>
  );
}

export default LevelProgress; 