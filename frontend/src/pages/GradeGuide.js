// src/pages/GradeGuide.js
import React from 'react';
import '../css/GradeGuide.css';
import { FaCrown } from 'react-icons/fa';

// 문자열의 첫 글자(그라페므)만 안전하게 추출
const firstChar = (s) => (Array.from(s || '')[0] || '');

// SVG → data URL
const makeBadgeDataUrl = (label, color) => {
  const stroke = '#1a6b66';
  const display = firstChar(label); // 👈 앞글자만 표시
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- 좌우 월계수 -->
  <g stroke="${stroke}" stroke-width="3.5" fill="${color}" opacity="0.85" filter="url(#soft)">
    <g transform="translate(70,130)">
      ${Array.from({length:8}).map((_,i)=>{
        const y= i*26; const x = Math.max(0, 38 - i*3);
        return `<ellipse cx="${x}" cy="${y}" rx="16" ry="9"/>`;
      }).join('')}
      <path d="M38,-10 v230" stroke="${stroke}" stroke-width="5" fill="none"/>
    </g>
    <g transform="translate(442,130) scale(-1,1)">
      ${Array.from({length:8}).map((_,i)=>{
        const y= i*26; const x = Math.max(0, 38 - i*3);
        return `<ellipse cx="${x}" cy="${y}" rx="16" ry="9"/>`;
      }).join('')}
      <path d="M38,-10 v230" stroke="${stroke}" stroke-width="5" fill="none"/>
    </g>
  </g>

  <!-- 방패 -->
  <g filter="url(#soft)">
    <path d="M256 88 C310 112,370 122,410 132 V258 C410 322,350 382,256 420 C162 382,102 322,102 258 V132 C142 122,202 112,256 88 Z"
          fill="${color}" stroke="${stroke}" stroke-width="6"/>
    <path d="M256 108 C304 130,358 138,388 146 V256 C388 312,340 360,256 394 C172 360,124 312,124 256 V146 C154 138,208 130,256 108 Z"
          fill="#ffffff" fill-opacity="0.14" stroke="${stroke}" stroke-width="2"/>
  </g>

  <!-- 중앙: 앞글자만 크게 -->
  <text x="256" y="258" text-anchor="middle"
        font-family="Pretendard, Noto Sans KR, sans-serif"
        font-weight="900" font-size="140" fill="${stroke}">${display}</text>

  <!-- 리본 -->
  <g filter="url(#soft)">
    <path d="M132 348 c38 -18, 210 -18, 248 0 v42 c-38 18, -210 18, -248 0 Z"
          fill="${color}" stroke="${stroke}" stroke-width="5"/>
  </g>
</svg>`;
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `data:image/svg+xml;charset=UTF-8,${encoded}`;
};

const grades = [
  { name: '브론즈',      color: '#cd7f32',   requirements: ['회원가입 시 기본으로 부여됩니다.', '모든 활동의 시작입니다!'] },
  { name: '실버',        color: '#c0c0c0',   requirements: ['포인트 100점 이상 획득', '문제 10개 이상 해결', '스니펫 5개 이상 작성'] },
  { name: '골드',        color: '#ffd700',   requirements: ['포인트 500점 이상 획득', '문제 50개 이상 해결', '스니펫 20개 이상 작성', '게시물 좋아요 30개 이상 획득'] },
  { name: '플래티넘',    color: '#64ffcb',   requirements: ['포인트 1000점 이상 획득', '문제 150개 이상 해결', '스니펫 50개 이상 작성', '대표 뱃지 3개 이상 보유'] },
  { name: '다이아몬드',  color: '#0099ffff', requirements: ['포인트 2500점 이상 획득', '문제 300개 이상 해결', '상위 랭킹 10% 이내 달성', '모든 카테고리 뱃지 획득'] },
  { name: '마스터',      color: '#ab5ad1ff', requirements: ['포인트 5000점 이상', '문제 600개 이상 해결', '랭킹 상위 5% 유지(4주)'] },
  { name: '그랜드마스터', color: '#d67471ff', requirements: ['포인트 10000점 이상', '문제 1200개 이상 해결', '랭킹 상위 1% 달성'] },
  { name: '레전드',      color: '#00eeffff', requirements: ['포인트 20000점 이상', '장기 기여자(1년+)', '커뮤니티 기여(문서/리뷰/PR)'] },
].map(g => ({ ...g, icon: makeBadgeDataUrl(g.name, g.color) }));

function GradeGuide() {
  return (
    <div className="grade-guide-page">
      <div className="page-header">
        <h1><FaCrown /> 등급 안내</h1>
        <p>SnippetHub 활동을 통해 등급을 올리고 다양한 혜택을 누려보세요.</p>
      </div>

      <div className="grades-container">
        {grades.map((grade, index) => (
          <div key={index} className="grade-card" style={{ borderColor: grade.color }}>
            <div className="grade-card-header" style={{ backgroundColor: grade.color }}>
              <img src={grade.icon} alt={`${grade.name} 등급`} className="grade-icon" />
              <h2 className="grade-name">{grade.name}</h2>
            </div>
            <div className="grade-card-body">
              <h3>승급 조건</h3>
              <ul className="requirements-list">
                {grade.requirements.map((req, i) => (<li key={i}>{req}</li>))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GradeGuide;
