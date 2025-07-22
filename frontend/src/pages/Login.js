import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Login.css';
import KakaoLoginButton from '../components/KakaoLoginButton';

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

  // OAuth2 에러 메시지 처리
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    
    if (error === 'oauth2_failed' && message) {
      // 영어 메시지를 한글로 변환
      let koreanMessage = message;
      if (message === 'Login failed') {
        koreanMessage = '로그인에 실패했습니다.';
      } else if (message === 'Email information required') {
        koreanMessage = '이메일 정보가 필요합니다.';
      } else if (message === 'Too many requests. Please try again later') {
        koreanMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      }
      setLoginError(koreanMessage);
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

      await login(data.data.token);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
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

          <div className="mb-3">
            <KakaoLoginButton />
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
