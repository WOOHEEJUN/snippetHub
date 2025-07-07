package com.snippethub.api.repository;

import com.snippethub.api.domain.Like;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LikeRepository extends JpaRepository<Like, Long> {
    boolean existsByUserIdAndPostId(Long userId, Long postId);
    boolean existsByUserIdAndSnippetId(Long userId, Long snippetId);
    void deleteByUserIdAndPostId(Long userId, Long postId);
    void deleteByUserIdAndSnippetId(Long userId, Long snippetId);
} 