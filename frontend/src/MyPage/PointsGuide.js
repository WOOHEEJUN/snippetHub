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
          <li>
            <span className="activity-name">게시글 작성</span>
            <span className="points-amount">+{guideData.postPoints || 10} P</span>
          </li>
          <li>
            <span className="activity-name">스니펫 작성</span>
            <span className="points-amount">+{guideData.snippetPoints || 15} P</span>
          </li>
          <li>
            <span className="activity-name">댓글 작성</span>
            <span className="points-amount">+{guideData.commentPoints || 5} P</span>
          </li>
          <li>
            <span className="activity-name">좋아요 받음</span>
            <span className="points-amount">+{guideData.likeReceivedPoints || 2} P</span>
          </li>
          <li>
            <span className="activity-name">코드 실행</span>
            <span className="points-amount">+{guideData.codeExecutionPoints || 1} P</span>
          </li>
          <li>
            <span className="activity-name">일일 로그인</span>
            <span className="points-amount">+{guideData.dailyLoginPoints || 5} P</span>
          </li>
          <li>
            <span className="activity-name">주간 로그인 보너스</span>
            <span className="points-amount">+{guideData.weeklyLoginBonus || 20} P</span>
          </li>
          <li>
            <span className="activity-name">월간 로그인 보너스</span>
            <span className="points-amount">+{guideData.monthlyLoginBonus || 100} P</span>
          </li>
        </ul>
      </div>

      <div className="guide-section">
        <h3>포인트 획득 팁</h3>
        <ul className="tips-list">
          <li>매일 로그인하여 일일 보상을 받으세요!</li>
          <li>다른 사용자의 게시글에 댓글을 남겨보세요.</li>
          <li>유용한 스니펫을 공유하면 더 많은 포인트를 얻을 수 있습니다.</li>
          <li>코딩 문제를 풀어보세요.</li>
          <li>AI 기능을 활용해보세요.</li>
        </ul>
      </div>
    </div>
  );
}

export default PointsGuide;
