
import React from 'react';

const KAKAO_AUTH_URL = "/oauth2/authorization/kakao";

function KakaoLoginButton() {
  const handleLogin = () => {
    try {
      console.log('카카오 로그인 시작:', KAKAO_AUTH_URL);
      window.location.href = KAKAO_AUTH_URL;
    } catch (error) {
      console.error('카카오 로그인 에러:', error);
      alert('카카오 로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <button 
      onClick={handleLogin} 
      style={{ 
        border: 'none', 
        padding: '12px 20px', 
        borderRadius: '8px',
        width: '100%',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
    >
      <span>카카오</span>
      <span>카카오로 로그인</span>
    </button>
  );
}

const GOOGLE_AUTH_URL = "/oauth2/authorization/google";

function GoogleLoginButton() {
  return (
    <a
      href={GOOGLE_AUTH_URL}
      style={{
        display: "inline-block",
        border: "1px solid #ddd",
        padding: "10px 20px",
        borderRadius: "4px",
        cursor: "pointer",
        textDecoration: "none",
        fontWeight: "bold"
      }}
    >
      <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" style={{ width: 20, marginRight: 8, verticalAlign: "middle" }} />
      구글 계정으로 로그인
    </a>
  );
}

export { KakaoLoginButton, GoogleLoginButton };