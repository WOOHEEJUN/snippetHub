// src/context/AuthContext.js
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

  const getAuthHeaders = () =>
    accessToken
      ? { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      : {};

  const fetchUser = async (token) => {
    if (fetchUserPromise.current) {
      try { await fetchUserPromise.current; return; } catch {}
    }

    fetchUserPromise.current = (async () => {
      try {
        // 1) 프로필
        const userDataRes = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (userDataRes.status === 401) {
          const newAccessToken = await reissueToken();
          await fetchUser(newAccessToken);
          return;
        }
        if (!userDataRes.ok) throw new Error(`HTTP error! status: ${userDataRes.status}`);

        const userData = await userDataRes.json();
        let fetchedUser = userData.data || {};

        // 2) 대표 뱃지
        try {
          const featuredBadgeRes = await fetch('/api/badges/my/featured', {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          if (featuredBadgeRes.ok) {
            const featuredBadgeData = await featuredBadgeRes.json();
            const arr = Array.isArray(featuredBadgeData?.data)
              ? featuredBadgeData.data
              : (Array.isArray(featuredBadgeData) ? featuredBadgeData : []);
            fetchedUser = { ...fetchedUser, representativeBadge: arr[0] || null };
          } else {
            console.warn('Failed to fetch featured badge:', featuredBadgeRes.status);
          }
        } catch (e) {
          console.error('Error fetching featured badge:', e);
        }

        setUser(fetchedUser);
        localStorage.setItem('user', JSON.stringify(fetchedUser));
        if (fetchedUser?.representativeBadge) {
          try { localStorage.setItem('repBadge', JSON.stringify(fetchedUser.representativeBadge)); } catch {}
        } else {
          localStorage.removeItem('repBadge');
        }
        if (fetchedUser?.email) localStorage.setItem('userEmail', fetchedUser.email);
        if (fetchedUser?.userId) localStorage.setItem('userId', fetchedUser.userId);
      } catch (err) {
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${refreshToken}` },
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
      throw error;
    }
  };

  const login = async (tokens) => {
    if (!tokens || !tokens.token || !tokens.token.accessToken) {
      throw new Error('Invalid tokens structure');
    }
    localStorage.setItem('accessToken', tokens.token.accessToken);
    localStorage.setItem('refreshToken', tokens.token.refreshToken);
    if (tokens.user) {
      localStorage.setItem('user', JSON.stringify(tokens.user));
      if (tokens.user.userId) localStorage.setItem('userId', tokens.user.userId);
    }
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
    localStorage.removeItem('userId');
    localStorage.removeItem('repBadge');
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setLoading(false);
    fetchUserPromise.current = null;
  };

  const refetchUser = async () => {
    if (accessToken) {
      setLoading(true);
      await fetchUser(accessToken);
    }
  };

  /** 대표 뱃지 바꿀 때 헤더 즉시 반영 + 캐시 업데이트 */
  const updateRepresentativeBadge = (badge) => {
    setUser((prevUser) => {
      const updatedUser = { ...(prevUser || {}), representativeBadge: badge || null };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      try {
        if (badge) localStorage.setItem('repBadge', JSON.stringify(badge));
        else localStorage.removeItem('repBadge');
      } catch {}
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        user,
        isAuthenticated: !!user && !!accessToken,
        login,
        logout,
        getAuthHeaders,
        loading,
        refetchUser,
        updateRepresentativeBadge,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
