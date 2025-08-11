import React from 'react';
import '../css/GradeGuide.css';
import { FaCrown } from 'react-icons/fa';

const grades = [
  {
    name: '브론즈',
    icon: '/badges/bronze.png',
    requirements: [
      '회원가입 시 기본으로 부여됩니다.',
      '모든 활동의 시작입니다!'
    ],
    color: '#cd7f32'
  },
  {
    name: '실버',
    icon: '/badges/silver.png',
    requirements: [
      '포인트 100점 이상 획득',
      '문제 10개 이상 해결',
      '스니펫 5개 이상 작성'
    ],
    color: '#c0c0c0'
  },
  {
    name: '골드',
    icon: '/badges/gold.png',
    requirements: [
      '포인트 2000점 이상 획득',
      '문제 50개 이상 해결',
      '스니펫 20개 이상 작성',
      '게시물 좋아요 30개 이상 획득'
    ],
    color: '#ffd700'
  },
  {
    name: '플래티넘',
    icon: '/badges/platinum.png',
    requirements: [
      '포인트 5000점 이상 획득',
      '문제 150개 이상 해결',
      '스니펫 50개 이상 작성',
      '대표 뱃지 3개 이상 보유'
    ],
    color: '#64ffcbff'
  },
  {
    name: '다이아몬드',
    icon: '/badges/diamond.png',
    requirements: [
      '포인트 10000점 이상 획득',
      '문제 300개 이상 해결',
      '상위 랭킹 10% 이내 달성',
      '모든 카테고리 뱃지 획득'
    ],
    color: '#00d0ffff'
  }
];

function GradeGuide() {
  return (
    <div className="grade-guide-page">
      <div className="page-header">
        <h1><FaCrown /> 등급 안내</h1>
        <p>SnippetHub 활동을 통해 등급을 올리고 다양한 혜택을 누려보세요.</p>
      </div>
      <div className="grades-container">
        {grades.map((grade, index) => (
          <div key={index} className="grade-card" style={{borderColor: grade.color}}>
            <div className="grade-card-header" style={{backgroundColor: grade.color}}>
              <img src={grade.icon} alt={`${grade.name} 등급`} className="grade-icon" />
              <h2 className="grade-name">{grade.name}</h2>
            </div>
            <div className="grade-card-body">
              <h3>승급 조건</h3>
              <ul className="requirements-list">
                {grade.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GradeGuide;
