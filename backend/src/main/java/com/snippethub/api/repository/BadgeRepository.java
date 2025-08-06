package com.snippethub.api.repository;

import com.snippethub.api.domain.Badge;
import com.snippethub.api.domain.BadgeCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BadgeRepository extends JpaRepository<Badge, Long> {

    List<Badge> findByCategory(BadgeCategory category);
    
    List<Badge> findByIsHiddenFalse();
    
    @Query("SELECT b FROM Badge b WHERE b.category = :category AND b.requiredCount <= :count AND b.id NOT IN " +
           "(SELECT ub.badge.id FROM UserBadge ub WHERE ub.user.id = :userId)")
    List<Badge> findEligibleBadgesByCategory(@Param("category") BadgeCategory category, 
                                           @Param("count") int count, 
                                           @Param("userId") Long userId);
    
    Optional<Badge> findByName(String name);
} 