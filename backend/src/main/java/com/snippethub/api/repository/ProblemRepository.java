package com.snippethub.api.repository;

import com.snippethub.api.domain.Problem;
import com.snippethub.api.domain.ProblemCategory;
import com.snippethub.api.domain.ProblemDifficulty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProblemRepository extends JpaRepository<Problem, Long> {

    // 활성화된 문제들 조회
    Page<Problem> findByIsActiveTrue(Pageable pageable);
    
    // 난이도별 문제 조회
    Page<Problem> findByDifficultyAndIsActiveTrue(ProblemDifficulty difficulty, Pageable pageable);
    
    // 카테고리별 문제 조회
    Page<Problem> findByCategoryAndIsActiveTrue(ProblemCategory category, Pageable pageable);
    
    // 난이도 + 카테고리별 문제 조회
    Page<Problem> findByDifficultyAndCategoryAndIsActiveTrue(
        ProblemDifficulty difficulty, ProblemCategory category, Pageable pageable);
    
    // 제목 검색
    Page<Problem> findByTitleContainingIgnoreCaseAndIsActiveTrue(String title, Pageable pageable);
    
    // 랜덤 문제 조회 (일일 과제용)
    @Query(value = "SELECT * FROM problems WHERE is_active = true ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Optional<Problem> findRandomActiveProblem();
    
    // 난이도별 랜덤 문제 조회
    @Query(value = "SELECT * FROM problems WHERE difficulty = :difficulty AND is_active = true ORDER BY RAND() LIMIT 1", nativeQuery = true)
    Optional<Problem> findRandomProblemByDifficulty(@Param("difficulty") String difficulty);
    
    // 사용자가 풀지 않은 문제들 조회
    @Query("SELECT p FROM Problem p WHERE p.isActive = true AND p.id NOT IN " +
           "(SELECT DISTINCT ps.problem.id FROM ProblemSubmission ps WHERE ps.user.id = :userId)")
    Page<Problem> findUnsolvedProblemsByUser(@Param("userId") Long userId, Pageable pageable);
    
    // 사용자가 풀지 않은 특정 난이도 문제들 조회
    @Query("SELECT p FROM Problem p WHERE p.isActive = true AND p.difficulty = :difficulty AND p.id NOT IN " +
           "(SELECT DISTINCT ps.problem.id FROM ProblemSubmission ps WHERE ps.user.id = :userId AND ps.status = 'ACCEPTED')")
    Page<Problem> findUnsolvedProblemsByUserAndDifficulty(@Param("userId") Long userId, 
                                                          @Param("difficulty") ProblemDifficulty difficulty, 
                                                          Pageable pageable);
    
    // 랜덤 활성화된 문제들 조회 (추천용)
    @Query(value = "SELECT * FROM problems WHERE is_active = true ORDER BY RAND() LIMIT :limit", nativeQuery = true)
    List<Problem> findRandomActiveProblems(@Param("limit") int limit);
    
    // 난이도별 문제 개수 조회
    long countByDifficultyAndIsActiveTrue(ProblemDifficulty difficulty);
    
    // 활성화된 문제 개수 조회
    long countByIsActiveTrue();
} 