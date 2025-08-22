import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuth2Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    console.log('=== OAuth2Callback 디버깅 시작 ===');
    console.log('OAuth2Callback useEffect 실행됨');
    console.log('현재 URL:', window.location.href);
    console.log('OAuth2Callback - URL 파라미터:', Object.fromEntries(searchParams.entries()));
    
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userStr = searchParams.get('user');

    console.log('accessToken 존재:', !!accessToken);
    console.log('refreshToken 존재:', !!refreshToken);
    console.log('userStr 존재:', !!userStr);

    if (accessToken && refreshToken) {
      console.log('토큰이 존재하므로 로그인 처리 시작');
      
      try {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        console.log('토큰을 localStorage에 저장 완료');
        
        if (userStr) {
          try {
            const user = JSON.parse(decodeURIComponent(userStr));
            localStorage.setItem('user', JSON.stringify(user));
            console.log('사용자 정보 파싱 및 저장 완료:', user);
          } catch (error) {
            console.error('사용자 정보 파싱 오류:', error);
          }
        }
        
        console.log('login 함수 호출 시작');
        const user = userStr ? JSON.parse(decodeURIComponent(userStr)) : null;
        login({ 
          token: { accessToken, refreshToken },
          user: user
        });
        console.log('login 함수 호출 완료');
        
        console.log('홈페이지로 리다이렉트 시작');
        navigate('/', { replace: true });
        console.log('홈페이지로 리다이렉트 완료');
      } catch (error) {
        console.error('로그인 처리 중 오류 발생:', error);
        alert('로그인 처리 중 오류가 발생했습니다.');
        navigate('/login', { replace: true });
      }
    } else {
      console.log('토큰이 없으므로 에러 처리');
      const error = searchParams.get('error');
      const message = searchParams.get('message');
      console.log('에러 정보:', { error, message });
      
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