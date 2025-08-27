// src/pages/Ranking.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserBadgeAndNickname from '../components/UserBadgeAndNickname';
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
      const params = new URLSearchParams({ page, size });
      const response = await fetch(`/api/users/ranking?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('랭킹 정보를 불러오기 실패');

      const data = await response.json();
      const users = data?.data?.content || [];

      // 각 사용자 대표뱃지 취득
      const withBadges = await Promise.all(users.map(async (u) => {
        try {
          const r = await fetch(`/api/badges/users/${u.userId}/featured`, {
            headers: getAuthHeaders(),
            credentials: 'include',
          });
          if (r.ok) {
            const j = await r.json();
            if (j?.data?.length) return { ...u, representativeBadge: j.data[0] };
          }
        } catch (e) { /* ignore */ }
        return u;
      }));

      setRankingData(withBadges);
      setTotalPages(data?.data?.totalPages || 0);
    } catch (err) {
      setError(err.message || '에러');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, page, size]);

  useEffect(() => { fetchRanking(); }, [fetchRanking]);

  if (loading) return <div className="loading-message">랭킹 정보를 불러오는 중...</div>;
  if (error)   return <div className="error-message">오류: {error}</div>;

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
            {rankingData.map((u, idx) => (
              <tr key={u.userId}>
                <td>{u.rank || page * size + idx + 1}</td>
                <td className="nickname-cell" onClick={() => navigate(`/users/${u.userId}`)}>
                  {/* 닉네임 중복 출력 금지 — 이 컴포넌트가 뱃지+닉네임 모두 렌더 */}
                  <UserBadgeAndNickname user={u} showLink={false} />
                </td>
                <td>{u.currentLevel}</td>
                <td>{u.currentPoints} P</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pagination-controls">
        <button onClick={() => setPage((p) => p - 1)} disabled={page === 0}>이전</button>
        <span>페이지 {page + 1} / {totalPages}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= totalPages}>다음</button>
      </div>
    </div>
  );
}

export default Ranking;
