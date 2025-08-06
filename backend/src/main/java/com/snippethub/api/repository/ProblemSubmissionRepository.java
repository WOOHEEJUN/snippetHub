package com.snippethub.api.repository;

import com.snippethub.api.domain.ProblemSubmission;
import com.snippethub.api.domain.SubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProblemSubmissionRepository extends JpaRepository<ProblemSubmission, Long> {

    // 사용자의 모든 제출 조회
    Page<ProblemSubmission> findByUserIdOrderBySubmittedAtDesc(Long userId, Pageable pageable);
    
    // 특정 문제의 사용자 제출 조회
    Page<ProblemSubmission> findByUserIdAndProblemIdOrderBySubmittedAtDesc(
        Long userId, Long problemId, Pageable pageable);
    
    // 사용자의 정답 제출만 조회
    Page<ProblemSubmission> findByUserIdAndStatusOrderBySubmittedAtDesc(
        Long userId, SubmissionStatus status, Pageable pageable);
    
    // 특정 문제의 모든 제출 조회
    Page<ProblemSubmission> findByProblemIdOrderBySubmittedAtDesc(Long problemId, Pageable pageable);
    
    // 사용자가 특정 문제를 풀었는지 확인
    boolean existsByUserIdAndProblemIdAndStatus(Long userId, Long problemId, SubmissionStatus status);
    
    // 사용자의 최근 제출 조회
    Optional<ProblemSubmission> findFirstByUserIdAndProblemIdOrderBySubmittedAtDesc(Long userId, Long problemId);
    
    // 사용자의 오늘 제출 수 조회
    @Query("SELECT COUNT(ps) FROM ProblemSubmission ps WHERE ps.user.id = :userId AND DATE(ps.submittedAt) = CURRENT_DATE")
    Long countTodaySubmissionsByUser(@Param("userId") Long userId);
    
    // 사용자의 이번 주 제출 수 조회
    @Query("SELECT COUNT(ps) FROM ProblemSubmission ps WHERE ps.user.id = :userId AND ps.submittedAt BETWEEN :startOfWeek AND :endOfWeek")
    Long countThisWeekSubmissionsByUser(@Param("userId") Long userId, 
                                       @Param("startOfWeek") LocalDateTime startOfWeek,
                                       @Param("endOfWeek") LocalDateTime endOfWeek);
    
    // 사용자의 연속 정답 일수 조회
    @Query("SELECT COUNT(DISTINCT DATE(ps.submittedAt)) FROM ProblemSubmission ps " +
           "WHERE ps.user.id = :userId AND ps.status = 'ACCEPTED' " +
           "AND ps.submittedAt >= :startDate")
    Long countConsecutiveCorrectDays(@Param("userId") Long userId, 
                                    @Param("startDate") LocalDateTime startDate);
    
    // 사용자의 문제별 최고 점수 조회
    @Query("SELECT ps FROM ProblemSubmission ps WHERE ps.user.id = :userId AND ps.problem.id = :problemId " +
           "AND ps.status = 'ACCEPTED' ORDER BY ps.executionTime ASC, ps.memoryUsed ASC LIMIT 1")
    Optional<ProblemSubmission> findBestSubmissionByUserAndProblem(@Param("userId") Long userId, 
                                                                  @Param("problemId") Long problemId);
} 