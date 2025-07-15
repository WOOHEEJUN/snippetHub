import React, { useRef, useState } from 'react';
import '../css/CodeTest.css';

function CodeTest() {
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const iframeRef = useRef(null);

  const runCode = () => {
  
    const safeJsCode = jsCode.replace(/<\/script>/gi, '<\\/script>');
    console.log(safeJsCode);
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
  };

  return (
    <div className="code-test-container">
      <div className="code-test-header">
        <h1>💻코드 테스트</h1>
      </div>

      <div className="editor-grid">
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
      </div>

      <button className="run-btn" onClick={runCode}>🚀 실행</button>

      <div className="preview-pane">
        <iframe
          ref={iframeRef}
          title="미리보기"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
}

export default CodeTest;
