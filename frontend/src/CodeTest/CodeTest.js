import React, { useState, useRef } from 'react';
import '../css/CodeTest.css';
import axios from 'axios';

const LANGUAGES = [
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'JSP', value: 'jsp' },
  { label: 'Java', value: 'java' },
  { label: 'Python', value: 'python' },
];

function CodeTest() {
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const [output, setOutput] = useState(''); // Added for backend execution output
  const [language, setLanguage] = useState('html'); // Added for language selection
  const [code, setCode] = useState(''); // Added for current code in editor
  const iframeRef = useRef(null);

  const handleRun = async () => {
    setOutput('');
    iframeRef.current.src = ''; // Clear iframe for server-side languages

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
    } else if (language === 'java' || language === 'python') {
      setOutput('코드 실행 중...');
      try {
        const response = await axios.post('/api/code/execute', { language, code });
        const data = response.data.data; // Access data property
        let result = '';
        if (data.output) result += data.output;
        if (data.error) result += `에러:
${data.error}`;
        setOutput(result || '실행 결과 없음.');
      } catch (error) {
        console.error('코드 실행 오류:', error);
        setOutput(`코드 실행 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
      }
    } else if (language === 'jsp') {
      setOutput('⚠️ JSP는 브라우저에서 직접 실행할 수 없습니다. 백엔드 연동이 필요합니다.');
    } else {
      // For HTML/CSS/JS combination (from original runCode)
      const safeJsCode = jsCode.replace(/<\/script>/gi, '<\\/script>');
      const combinedCode = `
        <html>
          <head>
            <meta charset="UTF-8" />
            <style>
              ${cssCode}
            </style>
          </head>
          <body>
            ${htmlCode}
            <script>
              ${safeJsCode}
            <\/script>
          </body>
        </html>
      `;
      const blob = new Blob([combinedCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    // Reset code based on language selection if needed
    if (e.target.value === 'html' || e.target.value === 'css' || e.target.value === 'jsp') {
      setCode(''); // Clear code for these languages as they use separate editors
    } else {
      setCode(''); // Clear code for other languages
    }
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  return (
    <div className="code-test-container">
      <div className="code-test-header">
        <h1>코드 테스트</h1>
        <select onChange={handleLanguageChange} value={language}>
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="editor-grid">
        {(language === 'html' || language === 'css' || language === 'jsp') ? (
          <>
            <div className="code-editor-block">
              <h4>HTML</h4>
              <textarea
                placeholder="HTML 입력"
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
              />
            </div>
            <div className="code-editor-block">
              <h4>CSS</h4>
              <textarea
                placeholder="CSS 입력"
                value={cssCode}
                onChange={(e) => setCssCode(e.target.value)}
              />
            </div>
            <div className="code-editor-block">
              <h4>JavaScript</h4>
              <textarea
                placeholder="JavaScript 입력"
                value={jsCode}
                onChange={(e) => setJsCode(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="code-editor-block full-width">
            <h4>{language.toUpperCase()} Code</h4>
            <textarea
              placeholder={`${language.toUpperCase()} 코드 입력`}
              value={code}
              onChange={handleCodeChange}
            />
          </div>
        )}
      </div>

      <button className="run-btn" onClick={handleRun}> 실행</button>

      <div className="preview-pane">
        {language === 'html' || language === 'css' ? (
          <iframe
            ref={iframeRef}
            title="미리보기"
            sandbox="allow-scripts"
          />
        ) : (
          <pre className="output-pane">{output}</pre>
        )}
      </div>
    </div>
  );
}

export default CodeTest;

