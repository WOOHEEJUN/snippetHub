// src/components/LevelProgress.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { FaCrown, FaStar, FaTrophy } from 'react-icons/fa';
import { levelsMeta as LEVELS } from '../utils/levels';
import '../css/LevelProgress.css';

function LevelProgress({ userLevel, userPoints = 0 }) {
  // 아이콘 매핑
  const iconByName = useMemo(() => ({
    BRONZE:    <FaStar   style={{ color: '#cd7f32' }} />,
    SILVER:    <FaStar   style={{ color: '#c0c0c0' }} />,
    GOLD:      <FaTrophy style={{ color: '#ffd700' }} />,
    PLATINUM:  <FaCrown  style={{ color: '#e5e4e2' }} />,
    DIAMOND:   <FaCrown  style={{ color: '#b9f2ff' }} />,
    MASTER:    <FaCrown  style={{ color: '#9370db' }} />,
    GRANDMASTER:<FaCrown style={{ color: '#ff4500' }} />,
    LEGEND:    <FaCrown  style={{ color: '#00bfff' }} />,
  }), []);

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // 현재 레벨을 points 기반으로 계산 (userLevel이 주어지면 우선 적용)
  const currentLevel = useMemo(() => {
    if (typeof userLevel === 'number') {
      // 숫자 레벨이 들어온 경우(1~8) 신뢰
      const found = LEVELS.find(l => l.level === userLevel);
      if (found) return found;
    }
    // 포인트로 계산
    return (
      LEVELS.find(l => userPoints >= l.minPoints && userPoints < l.maxPoints) ||
      LEVELS[LEVELS.length - 1]
    );
  }, [userLevel, userPoints]);

  const nextLevel = useMemo(
    () => LEVELS.find(l => l.level === currentLevel.level + 1) || null,
    [currentLevel]
  );

  // 진행도 계산
  const progressPercentage = useMemo(() => {
    if (!nextLevel || !isFinite(nextLevel.minPoints - currentLevel.minPoints)) return 100;
    const have = userPoints - currentLevel.minPoints;
    const need = nextLevel.minPoints - currentLevel.minPoints;
    return clamp(Math.round((have / need) * 100), 0, 100);
  }, [currentLevel, nextLevel, userPoints]);

  const pointsToNextLevel = useMemo(
    () => (nextLevel ? Math.max(0, nextLevel.minPoints - userPoints) : 0),
    [nextLevel, userPoints]
  );

  // 채워지는 애니메이션(부드럽게)
  const [animatedProgress, setAnimatedProgress] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedProgress(progressPercentage), 80);
    return () => clearTimeout(t);
  }, [progressPercentage]);

  const getLevelIcon = (name) => iconByName[name] || <FaStar />;

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
              title={`${progressPercentage}%`}
            >
              <div
                className="progress-fill"
                style={{
                  width: `${animatedProgress}%`,
                  background: '#8BC34A',
                }}
              />
            </div>

            <div className="progress-text">{progressPercentage}% 완료</div>
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
