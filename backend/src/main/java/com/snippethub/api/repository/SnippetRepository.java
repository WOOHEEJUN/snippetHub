package com.snippethub.api.repository;

import com.snippethub.api.domain.Snippet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SnippetRepository extends JpaRepository<Snippet, Long> {

    @Query("SELECT s FROM Snippet s JOIN FETCH s.user WHERE s.id = :id")
    Optional<Snippet> findById(@Param("id") Long id);

    List<Snippet> findByUserId(Long userId);
}
