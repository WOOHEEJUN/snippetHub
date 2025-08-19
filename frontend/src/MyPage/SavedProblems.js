import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/MyContentList.css';

function SavedProblems() {
  const [savedProblems, setSavedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) {
      setError('로그인이 필요합니다.');
      setLoading(false);
      return;
    }

    const fetchSavedProblems = async () => {
      try {
        const response = await fetch('/api/problems/saved', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setSavedProblems(data.data);
      } catch (error) {
        console.error('저장된 문제 불러오기 실패:', error);
        setError('저장된 문제를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedProblems();
  }, [token]);

  if (loading) {
    return <p className="loading-message">저장된 문제를 불러오는 중...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="my-content-container">
      <h2>저장한 문제</h2>
      {savedProblems.length > 0 ? (
        <ul className="content-list">
          {savedProblems.map((problem) => (
            <li key={problem.problemId} className="content-item">
              <Link to={`/problems/${problem.problemId}`} className="content-link">
                <h3 className="item-title">{problem.title}</h3>
                <div className="item-details">
                  <span className="language">{problem.difficulty}</span>
                  <span className="date">{new Date(problem.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-message">저장된 문제가 없습니다.</p>
      )}
    </div>
  );
}

export default SavedProblems;