// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchUserPromise = useRef(null);

  // ✅ 컴포넌트 마운트 시 localStorage에서 토큰 불러오기
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      fetchUser(storedAccessToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (accessToken) => {
    // 이미 진행 중인 요청이 있으면 기존 요청을 기다림
    if (fetchUserPromise.current) {
      try {
        await fetchUserPromise.current;
        return;
      } catch (error) {
        // 기존 요청이 실패했으면 새로운 요청 진행
      }
    }

    // 새로운 요청 생성
    fetchUserPromise.current = (async () => {
      try {
        const res = await fetch('/api/users/profile', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.status === 401) {
          try {
            const newAccessToken = await reissueToken();
            // 토큰 재발급 성공 시, 새로운 토큰으로 다시 fetchUser 호출
            await fetchUser(newAccessToken);
            return;
          } catch (reissueError) {
            // 토큰 재발급 실패 시 로그아웃은 reissueToken 함수에서 처리
            return;
          }
        }

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const userData = await res.json();
        setUser(userData.data.user); // user 필드에 실제 사용자 정보
      } catch (err) {
        console.error('사용자 정보 오류:', err);
        // 네트워크 오류나 5xx 에러는 로그아웃하지 않음
        if (err.message.includes('401') || err.message.includes('403')) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    })();

    await fetchUserPromise.current;
    fetchUserPromise.current = null;
  };

  const reissueToken = async () => {
    try {
      const res = await fetch('/api/auth/reissue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to reissue token');
      }

      const data = await res.json();
      const newAccessToken = data.data.accessToken;
      const newRefreshToken = data.data.refreshToken;

      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      return newAccessToken;
    } catch (error) {
      console.error('토큰 재발급 실패:', error);
      logout(); // 재발급 실패 시 로그아웃
      throw error;
    }
  };

  const login = async (tokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setLoading(true);
    await fetchUser(tokens.accessToken);
  };

  const logout = () => {
<<<<<<< HEAD
    localStorage.removeItem('token');
    setToken(null);
=======
    // 로그아웃 시 서버에 토큰 무효화 요청 (필요하다면)
    if (accessToken) {
      fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).catch(err => console.error('로그아웃 요청 실패:', err));
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setRefreshToken(null);
>>>>>>> 387f373e5b4a08d9f9598696460734c06ffe2c72
    setUser(null);
    setLoading(false);
    fetchUserPromise.current = null;
  };

  const getAuthHeaders = () => {
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  };

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, user, login, logout, getAuthHeaders, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
