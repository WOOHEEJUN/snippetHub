import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuth2Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const handled = useRef(false); // 중복 방지 플래그

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    console.log('OAuth2Callback useEffect 실행됨');
    console.log('OAuth2Callback - URL 파라미터:', Object.fromEntries(searchParams.entries()));
    
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userStr = searchParams.get('user');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      if (userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
          console.error('사용자 정보 파싱 오류:', error);
        }
      }
      login({ accessToken, refreshToken });
      navigate('/', { replace: true });
    } else {
      const error = searchParams.get('error');
      const message = searchParams.get('message');
      if (error === 'email_required') {
        alert('카카오 계정에서 이메일 정보를 제공해주세요.');
      } else if (error === 'oauth2_failed') {
        let koreanMessage = message || '로그인 중 오류가 발생했습니다.';
        if (message === 'Too many requests. Please try again later') {
          koreanMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        }
        alert(koreanMessage);
      } else {
        alert('로그인 중 오류가 발생했습니다.');
      }
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, login]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div>로그인 처리 중...</div>
      <div style={{ marginTop: '20px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  );
};

export default OAuth2Callback; 