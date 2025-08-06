import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/PointsGuide.css';

function PointsGuide() {
  const { getAuthHeaders } = useAuth();
  const [guideData, setGuideData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPointsGuide = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/points/guide', {
          headers: getAuthHeaders(),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('포인트 획득 기준 정보를 불러오기 실패');
        }

        const data = await response.json();
        setGuideData(data.data);
      } catch (err) {
        console.error('포인트 획득 기준 불러오기 실패:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPointsGuide();
  }, [getAuthHeaders]);

  if (loading) return <div className="loading-message">포인트 획득 기준 정보를 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;
  if (!guideData) return <div className="no-data-message">포인트 획득 기준 정보가 없습니다.</div>;

  return (
    <div className="points-guide-page">
      <h2>포인트 획득 기준 안내</h2>

      <div className="guide-section">
        <h3>활동별 포인트</h3>
        <ul className="points-list">
          {guideData.activityPoints && Object.entries(guideData.activityPoints).map(([activity, points]) => (
            <li key={activity}>
              <span className="activity-name">{activity}</span>
              <span className="points-amount">+{points} P</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="guide-section">
        <h3>등급별 혜택</h3>
        <ul className="benefits-list">
          {guideData.levelBenefits && Object.entries(guideData.levelBenefits).map(([level, benefit]) => (
            <li key={level}>
              <span className="level-name">{level}</span>
              <span className="benefit-description">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {guideData.additionalInfo && (
        <div className="guide-section">
          <h3>추가 정보</h3>
          <p className="additional-info">{guideData.additionalInfo}</p>
        </div>
      )}
    </div>
  );
}

export default PointsGuide;
