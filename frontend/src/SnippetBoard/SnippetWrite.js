import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/themes/prism.css';
import '../css/SnippetWrite.css';

const languageMap = {
  c: languages.c,
  python: languages.python,
  html: languages.html,
  javascript: languages.javascript,
  java: languages.java,
  css: languages.css,
};

const LANGUAGES = [
  { label: '언어 선택', value: '' },
  { label: 'C', value: 'c' },
  { label: 'Python', value: 'python' },
  { label: 'HTML', value: 'html' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Java', value: 'java' },
  { label: 'CSS', value: 'css' },
];

const SnippetWrite = () => {
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState(''); // 콤마로 구분된 문자열 입력
  const [isPublic, setIsPublic] = useState(true);
  const [code, setCode] = useState('// 코드를 여기에 입력하세요');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !language || !description || !code) {
      setError('모든 필드를 채워주세요.');
      return;
    }

    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/snippets', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          code,
          language,
          tags: tagsArray,
          public: isPublic,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || '스니펫 생성에 실패했습니다.');
      }

      alert('스니펫이 성공적으로 생성되었습니다.');
      navigate('/snippets');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container snippet-form-container">
      <div className="form-header">
        <h1>새 스니펫 작성</h1>
        <p className="text-muted">나누고 싶은 코드 조각을 공유해보세요.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">제목</label>
          <input
            type="text"
            id="title"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="스니펫의 제목을 입력하세요"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="language" className="form-label">언어</label>
          <select
            id="language"
            className="form-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value} disabled={lang.value === ''}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">설명</label>
          <textarea
            id="description"
            className="form-control"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="코드에 대한 간단한 설명을 추가하세요"
          ></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="tags" className="form-label">태그 (쉼표로 구분)</label>
          <input
            type="text"
            id="tags"
            className="form-control"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="예: 알고리즘, 정렬, 최적화"
          />
        </div>

        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="public"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />
          <label className="form-check-label" htmlFor="public">
            공개 여부
          </label>
        </div>

        <div className="mb-3">
          <label htmlFor="code" className="form-label">코드</label>
          <div className="code-editor-wrapper">
            <Editor
              value={code}
              onValueChange={code => setCode(code)}
              highlight={code => highlight(code, languageMap[language] || languages.clike, language)}
              padding={10}
              className="code-editor"
            />
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-secondary me-2" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '생성 중...' : '스니펫 생성'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SnippetWrite;
