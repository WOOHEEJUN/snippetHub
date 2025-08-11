package com.snippethub.api.repository;

import com.snippethub.api.domain.PointHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PointHistoryRepository extends JpaRepository<PointHistory, Long> {

    /**
     * 사용자의 포인트 히스토리 조회 (최신순)
     */
    Page<PointHistory> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * 사용자의 특정 기간 포인트 히스토리 조회
     */
    @Query("SELECT ph FROM PointHistory ph WHERE ph.user.id = :userId AND ph.createdAt BETWEEN :startDate AND :endDate ORDER BY ph.createdAt DESC")
    List<PointHistory> findByUserIdAndDateRange(@Param("userId") Long userId, 
                                               @Param("startDate") LocalDateTime startDate, 
                                               @Param("endDate") LocalDateTime endDate);

    /**
     * 사용자의 특정 타입 포인트 히스토리 조회
     */
    Page<PointHistory> findByUserIdAndPointTypeOrderByCreatedAtDesc(Long userId, PointHistory.PointType pointType, Pageable pageable);

    /**
     * 사용자의 총 획득 포인트 계산
     */
    @Query("SELECT COALESCE(SUM(ph.pointChange), 0) FROM PointHistory ph WHERE ph.user.id = :userId AND ph.pointChange > 0")
    Integer getTotalEarnedPoints(@Param("userId") Long userId);

    /**
     * 사용자의 총 차감 포인트 계산
     */
    @Query("SELECT COALESCE(SUM(ABS(ph.pointChange)), 0) FROM PointHistory ph WHERE ph.user.id = :userId AND ph.pointChange < 0")
    Integer getTotalSpentPoints(@Param("userId") Long userId);

    /**
     * 사용자의 가장 빈번한 포인트 획득 타입 조회
     */
    @Query("SELECT ph.pointType, COUNT(ph) as count FROM PointHistory ph WHERE ph.user.id = :userId AND ph.pointChange > 0 GROUP BY ph.pointType ORDER BY count DESC")
    List<Object[]> getMostFrequentPointType(@Param("userId") Long userId);
}
