package com.snippethub.api.repository;

import com.snippethub.api.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdAndParentIsNullOrderByCreatedAtAsc(Long postId);
    List<Comment> findBySnippetIdAndParentIsNullOrderByCreatedAtAsc(Long snippetId);
}