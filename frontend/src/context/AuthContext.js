// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchUserPromise = useRef(null);

  // ✅ 컴포넌트 마운트 시 localStorage에서 토큰 불러오기
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
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
        const res = await fetch('/api/v1/users/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.status === 401) {
          // 토큰이 유효하지 않은 경우에만 로그아웃
          logout();
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const userData = await res.json();
        setUser(userData);
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

  const login = async (accessToken) => {
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    setLoading(true);
    await fetchUser(accessToken);
  };

  const logout = () => {
    // 로그아웃 시 서버에 토큰 무효화 요청
    if (token) {
      fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(err => console.error('로그아웃 요청 실패:', err));
    }
    
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
    fetchUserPromise.current = null;
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, getAuthHeaders, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
