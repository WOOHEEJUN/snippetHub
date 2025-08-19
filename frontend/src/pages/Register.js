import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '', 
    nickname: '',
    agreeToTerms: false, 
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
      newErrors.password = '비밀번호는 필수 입력 값입니다.';
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,20}$/.test(formData.password)) {
      newErrors.password = '비밀번호는 8~20자 영문, 숫자, 특수문자를 사용하세요.';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인은 필수입니다.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    if (!formData.nickname) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    } else if (!/^[가-힣a-zA-Z0-9]{2,20}$/.test(formData.nickname)) {
      newErrors.nickname = '닉네임은 2~20자 한글, 영문, 숫자를 사용하세요.';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = '이용약관에 동의해야 합니다.';
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
          alert('회원가입이 완료되었습니다!');
          navigate('/login');
        } else {
        const errorData = await response.json();
        setRegisterError(errorData.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    

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
              placeholder="8~20자 영문, 숫자, 특수문자"
              required
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`form-control form-control-lg ${errors.confirmPassword ? 'is-invalid' : ''}`}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호 재입력"
              required
            />
            {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
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

          <div className="form-check mb-4">
            <input
              className={`form-check-input ${errors.agreeToTerms ? 'is-invalid' : ''}`}
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="agreeToTerms">
              <Link to="/terms" target="_blank" rel="noopener noreferrer">이용약관</Link>에 동의합니다.
            </label>
            {errors.agreeToTerms && <div className="invalid-feedback">{errors.agreeToTerms}</div>}
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