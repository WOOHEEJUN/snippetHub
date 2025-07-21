package com.snippethub.api.repository;

import com.snippethub.api.domain.Snippet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SnippetRepository extends JpaRepository<Snippet, Long> {

    Page<Snippet> findByLanguageAndTitleContainingIgnoreCaseOrLanguageAndDescriptionContainingIgnoreCaseOrLanguageAndCodeContainingIgnoreCase(
            String language1, String search1, String language2, String search2, String language3, String search3, Pageable pageable);

    Page<Snippet> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrCodeContainingIgnoreCase(
            String search1, String search2, String search3, Pageable pageable);

    Page<Snippet> findByLanguage(String language, Pageable pageable);
}
