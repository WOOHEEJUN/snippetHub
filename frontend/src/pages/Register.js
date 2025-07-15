import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setRegisterError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }
    if (!formData.nickname) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setRegisterError('');
    setRegisterSuccess(false);

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setRegisterSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorData = await response.json();
        setRegisterError(errorData.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      setRegisterError('서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>회원가입</h1>
          <p className="text-muted">Snippethub에서 새로운 여정을 시작하세요.</p>
        </div>

        {registerError && 
          <div className="alert alert-danger" role="alert">
            {registerError}
          </div>
        }
        {registerSuccess && (
          <div className="alert alert-success" role="alert">
            회원가입이 완료되었습니다! 잠시 후 로그인 페이지로 이동합니다.
          </div>
        )}

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
              placeholder="6자 이상 입력"
              required
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="nickname" className="form-label">닉네임</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              className={`form-control form-control-lg ${errors.nickname ? 'is-invalid' : ''}`}
              value={formData.nickname}
              onChange={handleChange}
              placeholder="사용할 닉네임"
              required
            />
            {errors.nickname && <div className="invalid-feedback">{errors.nickname}</div>}
          </div>

          <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={isLoading || registerSuccess}>
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span className="ms-2">가입하는 중...</span>
              </>
            ) : '회원가입'}
          </button>
        </form>

        <div className="login-footer mt-4">
          <p className="text-muted">이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register; 