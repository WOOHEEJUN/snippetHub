import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaCode, FaChevronDown } from 'react-icons/fa';
import '../css/LanguageSelector.css';

function LanguageSelector({ selectedLanguage, onLanguageChange, placeholder = "언어 선택" }) {
  const { getAuthHeaders } = useAuth();
  const [languages, setLanguages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/languages', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLanguages(data);
      } else {
        setLanguages([
          { id: 1, name: 'Java', extension: 'java', syntax: 'java' },
          { id: 2, name: 'Python', extension: 'py', syntax: 'python' },
          { id: 3, name: 'JavaScript', extension: 'js', syntax: 'javascript' },
          { id: 4, name: 'C++', extension: 'cpp', syntax: 'cpp' },
          { id: 5, name: 'C', extension: 'c', syntax: 'c' },
          { id: 6, name: 'C#', extension: 'cs', syntax: 'csharp' },
          { id: 7, name: 'Go', extension: 'go', syntax: 'go' },
          { id: 8, name: 'Rust', extension: 'rs', syntax: 'rust' },
          { id: 9, name: 'Kotlin', extension: 'kt', syntax: 'kotlin' },
          { id: 10, name: 'Swift', extension: 'swift', syntax: 'swift' },
          { id: 11, name: 'PHP', extension: 'php', syntax: 'php' },
          { id: 12, name: 'Ruby', extension: 'rb', syntax: 'ruby' },
          { id: 13, name: 'Scala', extension: 'scala', syntax: 'scala' },
          { id: 14, name: 'TypeScript', extension: 'ts', syntax: 'typescript' },
          { id: 15, name: 'R', extension: 'r', syntax: 'r' },
          { id: 16, name: 'MATLAB', extension: 'm', syntax: 'matlab' },
          { id: 17, name: 'Dart', extension: 'dart', syntax: 'dart' },
          { id: 18, name: 'Elixir', extension: 'ex', syntax: 'elixir' },
          { id: 19, name: 'Clojure', extension: 'clj', syntax: 'clojure' },
          { id: 20, name: 'Haskell', extension: 'hs', syntax: 'haskell' }
        ]);
      }
    } catch (err) {
      console.error('언어 목록 조회 실패:', err);
      setError('언어 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelect = (language) => {
    onLanguageChange(language);
    setIsOpen(false);
  };

  const getSelectedLanguageName = () => {
    if (!selectedLanguage) return placeholder;
    return selectedLanguage.name || selectedLanguage;
  };

  const getLanguageIcon = (languageName) => {
    const name = languageName.toLowerCase();
    if (name.includes('java')) return '☕';
    if (name.includes('python')) return '🐍';
    if (name.includes('javascript')) return '🟨';
    if (name.includes('typescript')) return '🔷';
    if (name.includes('c++') || name.includes('cpp')) return '🔵';
    if (name.includes('c#')) return '💜';
    if (name.includes('go')) return '🔵';
    if (name.includes('rust')) return '🦀';
    if (name.includes('kotlin')) return '🟠';
    if (name.includes('swift')) return '🍎';
    if (name.includes('php')) return '🐘';
    if (name.includes('ruby')) return '💎';
    if (name.includes('scala')) return '🔴';
    if (name.includes('r')) return '📊';
    if (name.includes('matlab')) return '📈';
    if (name.includes('dart')) return '🎯';
    if (name.includes('elixir')) return '💜';
    if (name.includes('clojure')) return '🟢';
    if (name.includes('haskell')) return '🔷';
    return '💻';
  };

  if (loading) {
    return (
      <div className="language-selector loading">
        <div className="selector-display">
          <FaCode className="language-icon" />
          <span>언어 목록 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="language-selector error">
        <div className="selector-display">
          <FaCode className="language-icon" />
          <span>언어 선택</span>
        </div>
      </div>
    );
  }

  return (
    <div className="language-selector">
      <div 
        className={`selector-display ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="selected-language">
          <span className="language-emoji">
            {getLanguageIcon(getSelectedLanguageName())}
          </span>
          <span className="language-name">{getSelectedLanguageName()}</span>
        </div>
        <FaChevronDown className={`chevron ${isOpen ? 'rotated' : ''}`} />
      </div>

      {isOpen && (
        <div className="language-dropdown">
          <div className="dropdown-header">
            <span>프로그래밍 언어 선택</span>
          </div>
          <div className="language-list">
            {languages.map((language) => (
              <div
                key={language.id || language.name}
                className={`language-option ${selectedLanguage?.name === language.name ? 'selected' : ''}`}
                onClick={() => handleLanguageSelect(language)}
              >
                <span className="language-emoji">
                  {getLanguageIcon(language.name)}
                </span>
                <span className="language-name">{language.name}</span>
                <span className="language-extension">.{language.extension}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
