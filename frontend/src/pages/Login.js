import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Login.css';
import { KakaoLoginButton, GoogleLoginButton } from '../components/LoginButton';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setLoginError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식입니다.';
    }
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    
    if (error === 'oauth2_failed' && message) {
      setLoginError(message);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.message || '이메일 또는 비밀번호가 올바르지 않습니다.');
        return;
      }

      console.log('로그인 응답 데이터:', data);
      console.log('login 함수 호출 전');
      await login(data.data);
      console.log('login 함수 호출 후');
      console.log('localStorage 확인:', {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
        user: localStorage.getItem('user')
      });
      navigate('/');
    } catch (error) {
      
      setLoginError('서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>로그인</h1>
          <p className="text-muted">Snippethub에 오신 것을 환영합니다.</p>
        </div>

        {loginError && 
          <div className="alert alert-danger" role="alert">
            {loginError}
          </div>
        }

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">이메일 주소</label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-control form-control-lg ${errors.email ? 'is-invalid' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              required
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호"
              required
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <div className="mb-3">
            <button type="submit" className="btn btn-primary btn-lg w-100" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          <div className="social-login-divider">
            <span>또는</span>
          </div>

          <div className="d-grid gap-2">
            <a href="https://snippethub.co.kr/oauth2/authorization/kakao" className="btn social-login-btn kakao-btn">
              <i className="bi bi-chat-fill me-2"></i> 카카오로 로그인
            </a>
            <a href="https://snippethub.co.kr/oauth2/authorization/google" className="btn social-login-btn google-btn">
              <svg className="me-2" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd">
                    <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7772 2.7218v2.2591h2.9082c1.7018-1.5664 2.6836-3.8736 2.6836-6.6218z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.47-.8055 5.96-2.1818l-2.9082-2.2591c-.8055.54-1.8373.8627-3.0518.8627-2.3455 0-4.3282-1.5873-5.0355-3.71H.9545v2.3318C2.45 16.3 5.48 18 9 18z" fill="#34A853"/>
                    <path d="M3.9645 10.71c-.18-.54-.2827-1.1164-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9545C.3473 6.1736 0 7.5473 0 9s.3473 2.8264.9545 4.0418L3.9645 10.71z" fill="#FBBC05"/>
                    <path d="M9 3.5727c1.3218 0 2.5073.4555 3.44 1.3455l2.5818-2.5818C13.46.8918 11.43 0 9 0 5.48 0 2.45 1.7 1.0455 4.0418L3.9645 6.29C4.6718 4.1636 6.6545 3.5727 9 3.5727z" fill="#EA4335"/>
                </g>
              </svg>
              구글로 로그인
            </a>
          </div>
        </form>

        <div className="login-footer mt-4">
          <p className="text-muted">계정이 없으신가요? <Link to="/register">회원가입</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
