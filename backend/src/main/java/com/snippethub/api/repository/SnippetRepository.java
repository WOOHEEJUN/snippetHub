package com.snippethub.api.repository;

import com.snippethub.api.domain.Snippet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SnippetRepository extends JpaRepository<Snippet, Long> {

    // 언어별 필터링
    Page<Snippet> findByLanguage(String language, Pageable pageable);
    
    // 제목에서 검색
    Page<Snippet> findByTitleContainingIgnoreCase(String search, Pageable pageable);
    
    // 언어 + 제목 검색
    Page<Snippet> findByLanguageAndTitleContainingIgnoreCase(String language, String search, Pageable pageable);
}
