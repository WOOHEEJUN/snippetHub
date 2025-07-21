package com.snippethub.api.repository;

import com.snippethub.api.domain.Like;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByUserIdAndPostId(Long userId, Long postId);
    Optional<Like> findByUserIdAndSnippetId(Long userId, Long snippetId);
    boolean existsByUserIdAndPostId(Long userId, Long postId);
    boolean existsByUserIdAndSnippetId(Long userId, Long snippetId);
}