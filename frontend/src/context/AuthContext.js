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
        const userDataRes = await fetch('/api/users/profile', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (userDataRes.status === 401) {
          const newAccessToken = await reissueToken();
          await fetchUser(newAccessToken);
          return;
        }

        if (!userDataRes.ok) throw new Error(`HTTP error! status: ${userDataRes.status}`);

        const userData = await userDataRes.json();

        const representativeBadgeRes = await fetch('/api/users/me/representative-badge', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        let representativeBadge = null;
        if (representativeBadgeRes.ok) {
          const representativeBadgeData = await representativeBadgeRes.json();
          representativeBadge = representativeBadgeData.data;
        }

        const combinedUserData = { ...userData.data, representativeBadge };

        console.log("combinedUserData:", combinedUserData);
        setUser(combinedUserData);
        localStorage.setItem('user', JSON.stringify(combinedUserData));
        localStorage.setItem('userEmail', userData.data.email);
        localStorage.setItem('userId', userData.data.userId);
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
      logout();
      throw error;
    }
  };

  const login = async (tokens) => {
    console.log('AuthContext login 함수 호출됨:', tokens);
    
    // 데이터 구조 검증
    if (!tokens || !tokens.token || !tokens.token.accessToken) {
      console.error('Invalid tokens structure:', tokens);
      throw new Error('Invalid tokens structure');
    }
    
    console.log('localStorage에 토큰 저장 시작');
    localStorage.setItem('accessToken', tokens.token.accessToken);
    localStorage.setItem('refreshToken', tokens.token.refreshToken);
    
    if (tokens.user) {
      localStorage.setItem('user', JSON.stringify(tokens.user));
      if (tokens.user.userId) {
        localStorage.setItem('userId', tokens.user.userId);
      }
    }
    
    console.log('localStorage에 토큰 저장 완료');
    console.log('AccessToken:', localStorage.getItem('accessToken'));
    console.log('RefreshToken:', localStorage.getItem('refreshToken'));
    console.log('User:', localStorage.getItem('user'));

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
      isAuthenticated: !!user && !!accessToken,
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