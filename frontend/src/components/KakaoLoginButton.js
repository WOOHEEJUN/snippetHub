// src/components/KakaoLoginButton.js
import React from 'react';

const KAKAO_AUTH_URL = "http://localhost:8080/oauth2/authorization/kakao";

function KakaoLoginButton() {
  const handleLogin = () => {
    window.location.href = KAKAO_AUTH_URL;
  };

  return (
    <button onClick={handleLogin} style={{ background: '#fee500', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '5px' }}>
      카카오로 로그인
    </button>
  );
}

export default KakaoLoginButton;