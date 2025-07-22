import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import '../css/SnippetWrite.css'; // Write CSS 재활용

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

const SnippetEdit = () => {
  const { snippetId } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders, user } = useAuth();

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [tags, setTags] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSnippet = useCallback(async () => {
    try {
      const response = await fetch(`/api/snippets/${snippetId}`);
      if (!response.ok) throw new Error('스니펫 정보를 불러올 수 없습니다.');
      const data = await response.json();

      // Check if the logged-in user is the author
      if (user?.userId !== data.author?.userId) {
        alert('수정 권한이 없습니다.');
        navigate(`/snippets/${snippetId}`);
        return;
      }

      setTitle(data.title);
      setLanguage(data.language);
      setDescription(data.description);
      setCode(data.code);
      setTags(data.tags || []);
      setIsPublic(data.public || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [snippetId, navigate, user]);

  useEffect(() => {
    fetchSnippet();
  }, [fetchSnippet]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !language || !description || !code) {
      setError('모든 필드를 채워주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    console.log(user);

    try {
      const response = await fetch(`/api/snippets/${snippetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ title, description, code, language, tags, public: isPublic }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || '스니펫 수정에 실패했습니다.');
      }

      alert('스니펫이 성공적으로 수정되었습니다.');
      navigate(`/snippets/${snippetId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;

  return (
    <div className="container snippet-form-container">
      <div className="form-header">
        <h1>스니펫 수정</h1>
        <p className="text-muted">스니펫의 내용을 수정합니다.</p>
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
          ></textarea>
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

        <div className="mb-3">
          <label htmlFor="tags" className="form-label">태그 (쉼표로 구분)</label>
          <input
            type="text"
            id="tags"
            className="form-control"
            value={tags.join(', ')}
            onChange={(e) => setTags(e.target.value.split(',').map(tag => tag.trim()))}
            placeholder="예: java, spring, backend"
          />
        </div>

        <div className="mb-3 form-check">
          <input
            type="checkbox"
            id="isPublic"
            className="form-check-input"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <label htmlFor="isPublic" className="form-check-label">공개 스니펫</label>
        </div>

        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-secondary me-2" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '수정 중...' : '수정 완료'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SnippetEdit;
