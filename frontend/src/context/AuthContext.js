import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchUserPromise = useRef(null);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      if (storedUser) setUser(JSON.parse(storedUser));
      fetchUser(storedAccessToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (accessToken) => {
    if (fetchUserPromise.current) {
      try {
        await fetchUserPromise.current;
        return;
      } catch {}
    }

    fetchUserPromise.current = (async () => {
      try {
        const res = await fetch('/api/users/profile', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (res.status === 401) {
          const newAccessToken = await reissueToken();
          await fetchUser(newAccessToken);
          return;
        }

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const userData = await res.json();
        setUser(userData.data);
        localStorage.setItem('user', JSON.stringify(userData.data));
      } catch (err) {
        console.error('사용자 정보 오류:', err);
        logout();
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
          Authorization: `Bearer ${refreshToken}`,
        },
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to reissue token');

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
      logout();
      throw error;
    }
  };

  const login = async (tokens) => {
    if (!tokens || !tokens.token || !tokens.token.accessToken || !tokens.token.refreshToken || !tokens.user) {
      console.error('❌ login()에 전달된 토큰/유저 정보가 부족합니다:', tokens);
      return;
    }

    localStorage.setItem('accessToken', tokens.token.accessToken);
    localStorage.setItem('refreshToken', tokens.token.refreshToken);
    localStorage.setItem('user', JSON.stringify(tokens.user));

    setAccessToken(tokens.token.accessToken);
    setRefreshToken(tokens.token.refreshToken);
    setUser(tokens.user);

    setLoading(true);
    await fetchUser(tokens.token.accessToken);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setLoading(false);
    fetchUserPromise.current = null;
  };

  const getAuthHeaders = () => {
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  };

  const refetchUser = async () => {
    if (accessToken) {
      setLoading(true);
      await fetchUser(accessToken);
    }
  };

  return (
    <AuthContext.Provider value={{
      accessToken,
      refreshToken,
      user,
      login,
      logout,
      getAuthHeaders,
      loading,
      refetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
