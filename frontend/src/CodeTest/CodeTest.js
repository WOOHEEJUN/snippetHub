// src/pages/CodeTest.js
import React, { useState, useRef } from 'react';
import './CodeTest.css';

const LANGUAGES = [
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'JSP', value: 'jsp' },
];

function CodeTest() {
  const [language, setLanguage] = useState('html');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const iframeRef = useRef(null);

  const handleRun = () => {
    setOutput('');

    if (language === 'html') {
      const blob = new Blob([code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;
    } else if (language === 'css') {
      const html = `
        <html>
          <head><style>${code}</style></head>
          <body><h3 style="text-align:center;">CSS 미리보기</h3></body>
        </html>
      `;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;
    } else {
      iframeRef.current.src = '';
      setOutput('⚠️ JSP는 브라우저에서 직접 실행할 수 없습니다.');
    }
  };

  return (
    <div className="code-test-container">
      <h2>💻 코드 테스트</h2>

      <div className="language-select">
        <label>언어 선택:</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <textarea
        className="code-input"
        placeholder="여기에 코드를 작성하세요..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button className="run-btn" onClick={handleRun}>
        실행하기
      </button>

      {output && <div className="code-output">{output}</div>}

      <div className="preview-frame">
        <iframe title="미리보기" ref={iframeRef} sandbox="allow-scripts allow-same-origin" />
      </div>
    </div>
  );
}

export default CodeTest;
