// src/ProfileEdit.js
import React, { useState, useEffect } from 'react'; // useEffect 추가
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // useAuth 훅 임포트
import '../css/ProfileEdit.css';

function ProfileEdit() {
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth(); // user와 getAuthHeaders 훅 사용

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState(''); // bio 상태 추가
  const [profileImageFile, setProfileImageFile] = useState(null); // profileImageFile 상태 추가
  const [previewProfileImageUrl, setPreviewProfileImageUrl] = useState(''); // 미리보기 이미지 URL 상태

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // 컴포넌트 마운트 시 사용자 정보 불러오기
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setBio(user.bio || '');
      setPreviewProfileImageUrl(user.profileImage || ''); // 기존 프로필 이미지 설정
    }
  }, [user]);

  const handleNicknameChange = (e) => setNickname(e.target.value);
  const handleBioChange = (e) => setBio(e.target.value); // bio 변경 핸들러 추가
  const handleProfileImageChange = (e) => { // 프로필 이미지 변경 핸들러 추가
    if (e.target.files && e.target.files[0]) {
      setProfileImageFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewProfileImageUrl(event.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCurrentPasswordChange = (e) => setCurrentPassword(e.target.value);
  const handleNewPasswordChange = (e) => setNewPassword(e.target.value);

  const handleProfileUpdate = async (e) => { // handleNicknameSubmit -> handleProfileUpdate
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('nickname', nickname);
      formData.append('bio', bio);
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          Authorization: getAuthHeaders().Authorization, // Content-Type은 FormData 사용 시 자동 설정
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '프로필 변경 실패');
      }
      const data = await res.json();
      alert(`프로필이 성공적으로 변경되었습니다.`);
      // user 정보 업데이트 로직 필요 (AuthContext의 user 상태를 업데이트하거나, 새로고침)
      navigate('/mypage');
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getAuthHeaders().Authorization,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword: newPassword,
        }),
      });

      if (res.ok) {
        alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
        // AuthContext의 logout 함수를 사용하여 토큰 제거 및 상태 초기화
        // logout(); // useAuth에서 logout 함수를 가져와야 함
        navigate('/login');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말로 회원 탈퇴하시겠습니까? 되돌릴 수 없습니다.')) return;

    try {
      const res = await fetch('/api/users/profile', {
        method: 'DELETE',
        headers: {
          Authorization: getAuthHeaders().Authorization,
        },
      });

      if (res.status === 204) {
        alert('회원 탈퇴가 완료되었습니다.');
        // AuthContext의 logout 함수를 사용하여 토큰 제거 및 상태 초기화
        // logout(); // useAuth에서 logout 함수를 가져와야 함
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

      <form onSubmit={handleProfileUpdate} className="edit-form-card"> {/* onSubmit 변경 */}
        <h4>프로필 정보 변경</h4> {/* 제목 변경 */}
        <div className="form-group">
          <label htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            type="text"
            placeholder="새 닉네임을 입력하세요"
            value={nickname}
            onChange={handleNicknameChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="bio">자기소개</label>
          <textarea
            id="bio"
            placeholder="자기소개를 입력하세요"
            value={bio}
            onChange={handleBioChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="profileImage">프로필 이미지</label>
          <input
            id="profileImage"
            type="file"
            accept="image/*"
            onChange={handleProfileImageChange}
          />
          {previewProfileImageUrl && (
            <div className="mt-2">
              <img src={previewProfileImageUrl} alt="프로필 미리보기" style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '50%' }} />
            </div>
          )}
        </div>
        <button type="submit" className="btn-submit">프로필 변경</button> {/* 버튼 텍스트 변경 */}
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
            onChange={handleCurrentPasswordChange}
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
            onChange={handleNewPasswordChange}
            required
          />
        </div>
        <button type="submit" className="btn-submit">비밀번호 변경</button>
      </form>

      <div className="back-button-container">
        <button className="btn-back" onClick={() => navigate('/mypage')}>
          마이페이지로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default ProfileEdit;