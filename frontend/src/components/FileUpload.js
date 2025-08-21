import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUpload, FaFile, FaImage, FaTimes } from 'react-icons/fa';
import '../css/FileUpload.css';

function FileUpload({ onFileUploaded, acceptedTypes = ['image/*', '.pdf', '.txt', '.doc', '.docx'], maxSize = 20 }) {
  const { getAuthHeaders } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    setError(null);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > maxSize * 1024 * 1024) {
        setError(`파일 크기는 ${maxSize}MB 이하여야 합니다: ${file.name}`);
        continue;
      }

      const isValidType = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type);
        }
        return file.type.match(type);
      });

      if (!isValidType) {
        setError(`지원하지 않는 파일 타입입니다: ${file.name}`);
        continue;
      }

      await uploadFile(file);
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', getFileType(file));

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const uploadedFile = data.data;
          setUploadedFiles(prev => [...prev, uploadedFile]);
          if (onFileUploaded) {
            onFileUploaded(uploadedFile);
          }
        } else {
          setError(data.message || '파일 업로드에 실패했습니다.');
        }
      } else {
        setError('파일 업로드에 실패했습니다.');
      }
    } catch (err) {
      console.error('파일 업로드 실패:', err);
      setError('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.includes('pdf')) return 'DOCUMENT';
    if (file.type.includes('text')) return 'TEXT';
    if (file.type.includes('word') || file.type.includes('document')) return 'DOCUMENT';
    return 'OTHER';
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'IMAGE':
        return <FaImage />;
      case 'DOCUMENT':
      case 'TEXT':
      default:
        return <FaFile />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-upload">
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          className="file-input"
          disabled={uploading}
        />
        
        <div className="upload-content">
          <FaUpload className="upload-icon" />
          <h3>파일을 드래그하거나 클릭하여 업로드</h3>
          <p>지원 형식: 이미지, PDF, 텍스트, 문서</p>
          <p>최대 크기: {maxSize}MB</p>
          {uploading && <p className="uploading-text">업로드 중...</p>}
        </div>
      </div>

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4>업로드된 파일</h4>
          <div className="files-list">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <div className="file-icon">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="file-details">
                    <span className="file-name">{file.originalName}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button 
                  className="remove-file-btn"
                  onClick={() => removeFile(file.id)}
                  title="파일 제거"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
