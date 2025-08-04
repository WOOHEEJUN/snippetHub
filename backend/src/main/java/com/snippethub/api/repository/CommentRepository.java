package com.snippethub.api.repository;

import com.snippethub.api.domain.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    Page<Comment> findByPostId(Long postId, Pageable pageable);

    Page<Comment> findBySnippetId(Long snippetId, Pageable pageable);

    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);

    List<Comment> findBySnippetIdOrderByCreatedAtAsc(Long snippetId);

    // 대댓글 관련 메서드들
    List<Comment> findByPostIdAndParentCommentIsNullOrderByCreatedAtAsc(Long postId);
    
    List<Comment> findBySnippetIdAndParentCommentIsNullOrderByCreatedAtAsc(Long snippetId);
    
    List<Comment> findByParentCommentIdOrderByCreatedAtAsc(Long parentCommentId);
}
