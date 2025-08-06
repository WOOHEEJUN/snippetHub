package com.snippethub.api.repository;

import com.snippethub.api.domain.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    List<UserBadge> findByUserId(Long userId);
    
    List<UserBadge> findByUserIdAndIsFeaturedTrue(Long userId);
    
    @Query("SELECT COUNT(ub) FROM UserBadge ub WHERE ub.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(ub) FROM UserBadge ub WHERE ub.user.id = :userId AND ub.badge.category = :category")
    long countByUserIdAndCategory(@Param("userId") Long userId, @Param("category") String category);
    
    Optional<UserBadge> findByUserIdAndBadgeId(Long userId, Long badgeId);
    
    boolean existsByUserIdAndBadgeId(Long userId, Long badgeId);
} 