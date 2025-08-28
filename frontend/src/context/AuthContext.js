// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken'));
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [representativeBadge, setRepresentativeBadge] = useState(() => {
    try {
      const raw = localStorage.getItem('representativeBadge');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const fetchUserPromise = useRef(null);

  const getAuthHeaders = useMemo(() => () => {
    const token = accessToken || localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
  }, [accessToken]);

  const fetchUser = useCallback(async (token) => {
    if (fetchUserPromise.current) {
      return fetchUserPromise.current;
    }

    const promise = (async () => {
      try {
        const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        const profileRes = await fetch('/api/users/profile', { headers, credentials: 'include' });

        if (profileRes.status === 401) {
          const newAccessToken = await reissueToken();
          if (newAccessToken) {
            return fetchUser(newAccessToken); // 재귀 호출이지만 새 토큰으로 다시 시도
          }
          throw new Error('Token refresh failed');
        }
        if (!profileRes.ok) throw new Error(`HTTP error! status: ${profileRes.status}`);

        const userData = await profileRes.json();
        const fetchedUser = userData.data || {};

        setUser(fetchedUser);
        localStorage.setItem('user', JSON.stringify(fetchedUser));
        if (fetchedUser?.email) localStorage.setItem('userEmail', fetchedUser.email);
        if (fetchedUser?.userId) localStorage.setItem('userId', fetchedUser.userId);
      } catch (err) {
        console.error("Failed to fetch user, logging out.", err);
        logout(); // 실패 시 로그아웃 처리
      } finally {
        setLoading(false);
      }
    })();

    fetchUserPromise.current = promise;
    await promise;
    fetchUserPromise.current = null;
  }, []);

  const fetchRepresentativeBadge = useCallback(async () => {
    try {
      const res = await fetch('/api/badges/my/featured', {
        headers: getAuthHeaders(),
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch featured badge');
      const json = await res.json().catch(() => ({}));
      const arr = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      const first = arr[0] || null;
      
      updateRepresentativeBadge(first);

    } catch (e) {
      console.warn("Could not fetch representative badge.", e.message);
      updateRepresentativeBadge(null);
    }
  }, [getAuthHeaders]);


  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    if (storedAccessToken) {
      setLoading(true);
      fetchUser(storedAccessToken);
      fetchRepresentativeBadge();
    } else {
      setLoading(false);
    }
  }, [fetchUser, fetchRepresentativeBadge]);

  const reissueToken = async () => {
    const storedRefreshToken = refreshToken || localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      logout();
      return null;
    }
    try {
      const res = await fetch('/api/auth/reissue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storedRefreshToken}` },
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
      logout();
      return null;
    }
  };

  const login = async (tokens) => {
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = tokens.token;
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    if (tokens.user) {
      localStorage.setItem('user', JSON.stringify(tokens.user));
      if (tokens.user.userId) localStorage.setItem('userId', tokens.user.userId);
    }
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(tokens.user);

    setLoading(true);
    await fetchUser(newAccessToken);
    await fetchRepresentativeBadge();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('representativeBadge');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setRepresentativeBadge(null);
    setLoading(false);
    fetchUserPromise.current = null;
  };

  const updateRepresentativeBadge = (badgeOrNull) => {
    setRepresentativeBadge(badgeOrNull || null);
    if (badgeOrNull) {
      localStorage.setItem('representativeBadge', JSON.stringify(badgeOrNull));
    } else {
      localStorage.removeItem('representativeBadge');
    }
  };

  const value = useMemo(() => ({
    accessToken,
    user,
    isAuthenticated: !!user && !!accessToken,
    representativeBadge,
    loading,
    login,
    logout,
    getAuthHeaders,
    updateRepresentativeBadge,
  }), [user, accessToken, representativeBadge, loading, getAuthHeaders]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};