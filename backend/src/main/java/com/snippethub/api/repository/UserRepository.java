package com.snippethub.api.repository;

import com.snippethub.api.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByNickname(String nickname);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    @Query("SELECT COUNT(s.id) FROM Snippet s WHERE s.author.id = :userId")
    long countSnippetsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(p.id) FROM Post p WHERE p.author.id = :userId")
    long countPostsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(c.id) FROM Comment c WHERE c.author.id = :userId")
    long countCommentsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(l.id) FROM Like l WHERE l.user.id = :userId")
    long countLikesByUserId(@Param("userId") Long userId);

    @Query("SELECT SUM(s.viewCount) FROM Snippet s WHERE s.author.id = :userId")
    Long sumSnippetViewCountsByUserId(@Param("userId") Long userId);

    @Query("SELECT SUM(p.viewCount) FROM Post p WHERE p.author.id = :userId")
    Long sumPostViewCountsByUserId(@Param("userId") Long userId);
}