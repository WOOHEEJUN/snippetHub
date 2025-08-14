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
        console.log("userData.data:", userData.data);
        setUser(userData.data);
        localStorage.setItem('user', JSON.stringify(userData.data));
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
    

    console.log('localStorage에 토큰 저장 시작');
    localStorage.setItem('accessToken', tokens.token.accessToken);
    localStorage.setItem('refreshToken', tokens.token.refreshToken);
    localStorage.setItem('user', JSON.stringify(tokens.user));
    localStorage.setItem('userId', tokens.user.userId);
    console.log('localStorage에 토큰 저장 완료');
    console.log(localStorage.getItem('accessToken'));
    console.log(localStorage.getItem('refreshToken'));
    console.log(localStorage.getItem('user'));
    console.log(localStorage.getItem('userId'));

    
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
