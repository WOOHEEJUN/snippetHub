package com.snippethub.api.repository;

import com.snippethub.api.domain.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByCategory(String category, Pageable pageable);
    
    Page<Post> findByTitleContainingIgnoreCase(String search, Pageable pageable);
    
    Page<Post> findByCategoryAndTitleContainingIgnoreCase(String category, String search, Pageable pageable);
}
