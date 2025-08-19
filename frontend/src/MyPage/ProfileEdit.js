import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/ProfileEdit.css';


const API_BASE = '/api'; 

const ENDPOINTS = {
  profile: `${API_BASE}/users/profile`,   
  password: `${API_BASE}/users/password`, 
  me: `${API_BASE}/users/me`,             
};


const apiFetch = async (path, init = {}) => {
  const res = await fetch(path, { ...init, credentials: 'include' });
  if (!res.ok) {
    let bodyText = '';
    try { bodyText = await res.clone().text(); } catch {}
    console.error(`[API ERROR] ${init.method || 'GET'} ${path} -> ${res.status}`, bodyText);
  }
  return res;
};

const parseJsonSafe = async (res) => {
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return await res.json();
  } catch (_) {}
  return null;
};

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user, getAuthHeaders, refetchUser } = useAuth();

  const [nickname, setNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [error, setError] = useState('');

  
  useEffect(() => {
    if (user) setNickname(user.nickname || '');
  }, [user]);

  
  
  
  
  
  
  
  
  
  
  
  

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await apiFetch(ENDPOINTS.profile, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });

      if (res.status === 204) {
        alert('프로필이 저장되었습니다.');
        await refetchUser?.();
        navigate('/mypage');
        return;
      }

      const body = await parseJsonSafe(res);
      const msg = body?.message || res.statusText || '';

      if (res.status === 401) { alert(msg || '로그인이 필요합니다.'); return; }
      if (res.status === 403) { alert(msg || '권한이 없습니다.'); return; }
      if (res.status === 404) { alert(msg || '대상을 찾을 수 없습니다.'); return; }

      if (res.ok && body?.success !== false) {
        alert(body?.message || '프로필이 저장되었습니다.');
        await refetchUser?.();
        navigate('/mypage');
        return;
      }

      setError(msg || `저장 실패 (status: ${res.status})`);
      alert(msg || `저장 실패 (status: ${res.status})`);
    } catch (err) {
      console.error(err);
      setError('저장 중 오류가 발생했습니다.');
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdSaving(true);
    setError('');

    try {
      const res = await apiFetch(ENDPOINTS.password, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword: newPassword,
        }),
      });

      const body = await parseJsonSafe(res);
      const msg = body?.message || res.statusText || '';

      if (res.status === 204 || (res.ok && body?.success !== false)) {
        alert(body?.message || '비밀번호가 변경되었습니다. 다시 로그인해주세요.');
        navigate('/login');
        return;
      }

      alert(msg || '비밀번호 변경에 실패했습니다.');
    } catch (err) {
      console.error(err);
      alert('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="profile-edit-container">
      <h2>⚙️ 개인정보 수정</h2>

      
      <form onSubmit={handleProfileUpdate} className="edit-form-card">
        <h4>닉네임 변경</h4>

        <div className="form-group">
          <label htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            type="text"
            placeholder="새 닉네임을 입력하세요"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </div>

        {error && <div className="error-text" style={{ color: 'crimson', marginTop: 6 }}>{error}</div>}

        <button type="submit" className="btn-submit" disabled={saving}>
          {saving ? '저장 중…' : '프로필 변경'}
        </button>
      </form>

      
      <form onSubmit={handlePasswordSubmit} className="edit-form-card">
        <h4>비밀번호 변경</h4>

        <div className="form-group">
          <label htmlFor="currentPassword">현재 비밀번호</label>
          <input
            id="currentPassword"
            type="password"
            placeholder="현재 비밀번호를 입력하세요"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">새 비밀번호</label>
          <input
            id="newPassword"
            type="password"
            placeholder="새 비밀번호를 입력하세요"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-submit" disabled={pwdSaving}>
          {pwdSaving ? '변경 중…' : '비밀번호 변경'}
        </button>
      </form>

      <div className="back-button-container">
        <button className="btn-back" onClick={() => navigate('/mypage')}>
          마이페이지로 돌아가기
        </button>
      </div>
    </div>
  );
}