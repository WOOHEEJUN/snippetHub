// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';

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
            return fetchUser(newAccessToken); 
          }
          throw new Error('Token refresh failed');
        }
        if (!profileRes.ok) throw new Error(`HTTP error! status: ${profileRes.status}`);

        const userData = await profileRes.json();
        let fetchedUser = userData.data || {};

        // Fetch representative badge and attach to user object
        try {
          const res = await fetch('/api/badges/my/featured', {
            headers: getAuthHeaders(),
            credentials: 'include',
            cache: 'no-store',
          });
          const json = await res.json().catch(() => ({}));
          const arr = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
          const featuredBadge = arr[0] || null;
          fetchedUser = { ...fetchedUser, representativeBadge: featuredBadge };
          
          // Also update the separate representativeBadge state
          setRepresentativeBadge(featuredBadge);
          if (featuredBadge) {
            localStorage.setItem('representativeBadge', JSON.stringify(featuredBadge));
          } else {
            localStorage.removeItem('representativeBadge');
          }

        } catch (e) {
          console.warn("Could not fetch representative badge for user.", e.message);
          setRepresentativeBadge(null);
          localStorage.removeItem('representativeBadge');
        }

        setUser(fetchedUser);
        localStorage.setItem('user', JSON.stringify(fetchedUser));
        if (fetchedUser?.email) localStorage.setItem('userEmail', fetchedUser.email);
        if (fetchedUser?.userId) localStorage.setItem('userId', fetchedUser.userId);
      } catch (err) {
        console.error("Failed to fetch user, logging out.", err);
        logout();
      } finally {
        setLoading(false);
      }
    })();

    fetchUserPromise.current = promise;
    await promise;
    fetchUserPromise.current = null;
  }, [reissueToken, getAuthHeaders, logout]);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem('accessToken');
    if (storedAccessToken) {
      setLoading(true);
      fetchUser(storedAccessToken);
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const reissueToken = useCallback(async () => {
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
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);

      return newAccessToken;
    } catch (error) {
      logout();
      return null;
    }
  }, [refreshToken, logout]);

  const login = useCallback(async (tokens) => {
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
  }, [fetchUser]);

  const logout = useCallback(() => {
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
  }, []);

  const updateRepresentativeBadge = useCallback((badgeOrNull) => {
    setRepresentativeBadge(badgeOrNull || null);
    if (badgeOrNull) {
      localStorage.setItem('representativeBadge', JSON.stringify(badgeOrNull));
    } else {
      localStorage.removeItem('representativeBadge');
    }
    // Also update the user object in state
    setUser(prevUser => ({ ...prevUser, representativeBadge: badgeOrNull || null }));
    localStorage.setItem('user', JSON.stringify({ ...user, representativeBadge: badgeOrNull || null }));
  }, [user]);

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
  }), [user, accessToken, representativeBadge, loading, login, logout, getAuthHeaders, updateRepresentativeBadge]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};