import React, { useEffect, useState } from 'react';
import { FaCrown, FaStar, FaTrophy } from 'react-icons/fa';
import '../css/LevelProgress.css';

function LevelProgress({ userLevel, userPoints }) {
  const levels = [
    { level: 1, name: 'BRONZE',      minPoints: 0,     maxPoints: 100,    color: '#cd7f32' },
    { level: 2, name: 'SILVER',      minPoints: 100,   maxPoints: 500,    color: '#c0c0c0' },
    { level: 3, name: 'GOLD',        minPoints: 500,   maxPoints: 1000,   color: '#ffd700' },
    { level: 4, name: 'PLATINUM',    minPoints: 1000,  maxPoints: 2500,   color: '#e5e4e2' },
    { level: 5, name: 'DIAMOND',     minPoints: 2500,  maxPoints: 5000,   color: '#b9f2ff' },
    { level: 6, name: 'MASTER',      minPoints: 5000,  maxPoints: 10000,  color: '#800080' },
    { level: 7, name: 'GRANDMASTER', minPoints: 10000, maxPoints: 20000,  color: '#ff4500' },
    { level: 8, name: 'LEGEND',      minPoints: 20000, maxPoints: Infinity, color: '#00bfff' },
  ];

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const getCurrentLevelInfo = () =>
    levels.find(l => userPoints >= l.minPoints && userPoints < l.maxPoints) || levels[levels.length - 1];

  const getNextLevelInfo = () => {
    const cur = getCurrentLevelInfo();
    return levels.find(l => l.level === cur.level + 1);
  };

  const getProgressPercentage = () => {
    const cur = getCurrentLevelInfo();
    const next = getNextLevelInfo();
    if (!next || !isFinite(next.minPoints - cur.minPoints)) return 100;
    const have = userPoints - cur.minPoints;
    const need = next.minPoints - cur.minPoints;
    const pct = (have / need) * 100;
    return clamp(Math.round(pct), 0, 100);
  };

  const getLevelIcon = (levelName) => {
    switch (levelName) {
      case 'BRONZE': return <FaStar style={{ color: '#cd7f32' }} />;
      case 'SILVER': return <FaStar style={{ color: '#c0c0c0' }} />;
      case 'GOLD': return <FaTrophy style={{ color: '#ffd700' }} />;
      case 'PLATINUM': return <FaCrown style={{ color: '#e5e4e2' }} />;
      case 'DIAMOND': return <FaCrown style={{ color: '#b9f2ff' }} />;
      case 'MASTER': return <FaCrown style={{ color: '#9370db' }} />;
      case 'GRANDMASTER': return <FaCrown style={{ color: '#ff4500' }} />;
      case 'LEGEND': return <FaCrown style={{ color: '#00bfff' }} />;
      default: return <FaStar />;
    }
  };

  const [animatedProgress, setAnimatedProgress] = useState(0); // New state for animation

  const progressPercentage = getProgressPercentage(); // Keep this for calculation

  useEffect(() => {
    // When progressPercentage changes, update animatedProgress after a short delay
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercentage);
    }, 100); // 100ms delay

    return () => clearTimeout(timer); // Cleanup timer
  }, [progressPercentage]); // Re-run effect when progressPercentage changes

  const currentLevel = getCurrentLevelInfo();
  const nextLevel = getNextLevelInfo();
  const pointsToNextLevel = nextLevel ? Math.max(0, nextLevel.minPoints - userPoints) : 0;

  return (
    <div className="level-progress">
      <div className="level-header">
        <h3>🏆 레벨 정보</h3>
      </div>

      <div className="current-level-info">
        <div className="level-icon">{getLevelIcon(currentLevel.name)}</div>
        <div className="level-details">
          <div className="level-name">{currentLevel.name}</div>
          <div className="level-number">Level {currentLevel.level}</div>
          <div className="current-points">{userPoints} P</div>
        </div>
      </div>

      {nextLevel ? (
        <div className="next-level-info">
          <div className="progress-section">
            <div className="progress-header">
              <span>다음 레벨: {nextLevel.name}</span>
              <span>{pointsToNextLevel} P 더 필요</span>
            </div>

            {/* 왼쪽 기준 정렬 막대 */}
            <div
              className="progress-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercentage}
              aria-label="경험치 진행도"
            >
              <div
                className="progress-fill"
                style={{
                  height: `${animatedProgress}%`,
                  background: '#8BC34A',
                }}
              />
            </div>

            <div className="progress-text">
              {progressPercentage}% 완료
            </div>
          </div>
        </div>
      ) : (
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
