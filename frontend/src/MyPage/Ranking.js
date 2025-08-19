import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLevelBadgeImage } from '../utils/badgeUtils'; 
import '../css/Ranking.css';

function Ranking() {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [levelFilter, setLevelFilter] = useState(''); 
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
      if (levelFilter) {
        params.append('level', levelFilter);
      }

      const response = await fetch(`/api/users/ranking?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('랭킹 정보를 불러오기 실패');
      }

      const data = await response.json();
      setRankingData(data.data.content || []);
      setTotalPages(data.data.totalPages || 0);

    } catch (err) {
      
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, levelFilter, page, size]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  const handleLevelFilterChange = (e) => {
    setLevelFilter(e.target.value);
    setPage(0); 
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  if (loading) return <div className="loading-message">랭킹 정보를 불러오는 중...</div>;
  if (error) return <div className="error-message">오류: {error}</div>;

  return (
    <div className="ranking-page">
      <h2>사용자 랭킹</h2>

      <div className="filter-controls">
        <label htmlFor="levelFilter">등급 필터:</label>
        <select id="levelFilter" value={levelFilter} onChange={handleLevelFilterChange}>
          <option value="">전체</option>
          
          <option value="Bronze">Bronze</option>
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
          <option value="Platinum">Platinum</option>
          <option value="Diamond">Diamond</option>
        </select>
      </div>

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
                  {user.currentLevel && <img src={getLevelBadgeImage(user.currentLevel)} alt={user.currentLevel} className="level-badge-ranking" />}
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