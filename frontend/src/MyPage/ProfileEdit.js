// src/ProfileEdit.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/ProfileEdit.css';

function ProfileEdit() {
  const [nickname, setNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleNicknameChange = (e) => setNickname(e.target.value);
  const handleCurrentPasswordChange = (e) => setCurrentPassword(e.target.value);
  const handleNewPasswordChange = (e) => setNewPassword(e.target.value);

  const handleNicknameSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/users/me/nickname', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname }),
      });

      if (!res.ok) throw new Error('닉네임 변경에 실패했습니다.');
      const data = await res.json();
      alert(`닉네임이 "${data.nickname}"(으)로 변경되었습니다.`);
      navigate('/mypage');
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/users/me/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.status === 204) {
        alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        throw new Error('비밀번호 변경에 실패했습니다.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말로 회원 탈퇴하시겠습니까? 되돌릴 수 없습니다.')) return;

    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 204) {
        alert('회원 탈퇴가 완료되었습니다.');
        localStorage.removeItem('token');
        navigate('/');
      } else {
        throw new Error('회원 탈퇴에 실패했습니다.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="profile-edit-container">
      <h2>⚙️ 개인정보 수정</h2>

      <form onSubmit={handleNicknameSubmit} className="edit-form">
        <h4>닉네임 변경</h4>
        <input
          type="text"
          placeholder="새 닉네임"
          value={nickname}
          onChange={handleNicknameChange}
          required
        />
        <button type="submit">닉네임 변경</button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="edit-form">
        <h4>비밀번호 변경</h4>
        <input
          type="password"
          placeholder="현재 비밀번호"
          value={currentPassword}
          onChange={handleCurrentPasswordChange}
          required
        />
        <input
          type="password"
          placeholder="새 비밀번호"
          value={newPassword}
          onChange={handleNewPasswordChange}
          required
        />
        <button type="submit">비밀번호 변경</button>
      </form>

      <div className="edit-form">
        <h4>회원 탈퇴</h4>
        <button className="delete-btn" onClick={handleDeleteAccount}>
          회원 탈퇴하기
        </button>
      </div>
    </div>
  );
}

export default ProfileEdit;
