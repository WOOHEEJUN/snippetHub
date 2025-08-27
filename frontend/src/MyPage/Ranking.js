import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Removed getLevelBadgeImage as UserBadgeAndNickname will handle it
// import { getLevelBadgeImage } from '../utils/badgeUtils';
import UserBadgeAndNickname from '../components/UserBadgeAndNickname'; // Import the new component

import '../css/Ranking.css';

function Ranking() {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page,
        size: size,
      });

      const response = await fetch(`/api/users/ranking?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('랭킹 정보를 불러오기 실패');
      }

      const data = await response.json();
      let users = data.data.content || [];

      // Fetch representative badges for each user
      const usersWithBadges = await Promise.all(users.map(async (user) => {
        try {
          const badgeRes = await fetch(`/api/badges/users/${user.userId}/featured`, {
            headers: getAuthHeaders(),
            credentials: 'include',
          });
          if (badgeRes.ok) {
            const badgeData = await badgeRes.json();
            if (badgeData.data && badgeData.data.length > 0) {
              return { ...user, representativeBadge: badgeData.data[0] };
            }
          }
        } catch (err) {
          console.error(`Failed to fetch featured badge for user ${user.userId}:`, err);
        }
        return user; // Return user even if badge fetch fails
      }));

      setRankingData(usersWithBadges);
      setTotalPages(data.data.totalPages || 0);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, page, size]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  if (loading) return <div className="loading-message">랭킹 정보를 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;

  return (
    <div className="ranking-page">
      <h2>사용자 랭킹</h2>

      {rankingData.length === 0 ? (
        <div className="no-data-message">랭킹 정보가 없습니다.</div>
      ) : (
        <table className="ranking-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>닉네임</th>
              <th>등급</th>
              <th>포인트</th>
            </tr>
          </thead>
          <tbody>
            {rankingData.map((user, index) => (
              <tr key={user.userId}>
                <td>{user.rank || (page * size) + index + 1}</td>
                <td className="nickname-cell" onClick={() => navigate(`/users/${user.userId}`)}>
                  {/* Use the new UserBadgeAndNickname component */}
                  <UserBadgeAndNickname user={user} showLink={false} className="level-badge-ranking" />
                  {user.nickname}
                </td>
                <td>{user.currentLevel}</td>
                <td>{user.currentPoints} P</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pagination-controls">
        <button onClick={() => handlePageChange(page - 1)} disabled={page === 0}>이전</button>
        <span>페이지 {page + 1} / {totalPages}</span>
        <button onClick={() => handlePageChange(page + 1)} disabled={page + 1 >= totalPages}>다음</button>
      </div>
    </div>
  );
}

export default Ranking;
