package com.snippethub.api.service;

import com.snippethub.api.domain.Problem;
import com.snippethub.api.domain.ProblemCategory;
import com.snippethub.api.domain.ProblemDifficulty;
import com.snippethub.api.dto.problem.ProblemResponseDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ProblemService {

    private final ProblemRepository problemRepository;

    /**
     * 문제 생성
     */
    @Transactional
    public Problem createProblem(Problem problem) {
        Problem savedProblem = problemRepository.save(problem);
        log.info("새로운 문제가 생성되었습니다: {}", savedProblem.getTitle());
        return savedProblem;
    }

    /**
     * 문제 조회
     */
    public Problem getProblem(Long problemId) {
        return problemRepository.findById(problemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROBLEM_NOT_FOUND));
    }

    /**
     * 문제 수정
     */
    @Transactional
    public Problem updateProblem(Long problemId, Problem updatedProblem) {
        Problem existingProblem = getProblem(problemId);
        
        // 업데이트할 필드들 설정
        existingProblem.setActive(updatedProblem.isActive());
        // 다른 필드들도 필요에 따라 업데이트
        
        Problem savedProblem = problemRepository.save(existingProblem);
        log.info("문제가 수정되었습니다: {}", savedProblem.getTitle());
        return savedProblem;
    }

    /**
     * 문제 삭제 (비활성화)
     */
    @Transactional
    public void deleteProblem(Long problemId) {
        Problem problem = getProblem(problemId);
        problem.setActive(false);
        problemRepository.save(problem);
        log.info("문제가 비활성화되었습니다: {}", problem.getTitle());
    }

    /**
     * 활성화된 문제 목록 조회
     */
    public Page<ProblemResponseDto> getActiveProblems(Pageable pageable) {
        Page<Problem> problems = problemRepository.findByIsActiveTrue(pageable);
        return problems.map(ProblemResponseDto::new);
    }

    /**
     * 난이도별 문제 목록 조회
     */
    public Page<ProblemResponseDto> getProblemsByDifficulty(ProblemDifficulty difficulty, Pageable pageable) {
        Page<Problem> problems = problemRepository.findByDifficultyAndIsActiveTrue(difficulty, pageable);
        return problems.map(ProblemResponseDto::new);
    }

    /**
     * 카테고리별 문제 목록 조회
     */
    public Page<ProblemResponseDto> getProblemsByCategory(ProblemCategory category, Pageable pageable) {
        Page<Problem> problems = problemRepository.findByCategoryAndIsActiveTrue(category, pageable);
        return problems.map(ProblemResponseDto::new);
    }

    /**
     * 난이도 + 카테고리별 문제 목록 조회
     */
    public Page<ProblemResponseDto> getProblemsByDifficultyAndCategory(
            ProblemDifficulty difficulty, ProblemCategory category, Pageable pageable) {
        Page<Problem> problems = problemRepository.findByDifficultyAndCategoryAndIsActiveTrue(difficulty, category, pageable);
        return problems.map(ProblemResponseDto::new);
    }

    /**
     * 제목으로 문제 검색
     */
    public Page<ProblemResponseDto> searchProblemsByTitle(String title, Pageable pageable) {
        Page<Problem> problems = problemRepository.findByTitleContainingIgnoreCaseAndIsActiveTrue(title, pageable);
        return problems.map(ProblemResponseDto::new);
    }

    /**
     * 랜덤 문제 조회
     */
    public Optional<Problem> getRandomProblem() {
        return problemRepository.findRandomActiveProblem();
    }

    /**
     * 난이도별 랜덤 문제 조회
     */
    public Optional<Problem> getRandomProblemByDifficulty(ProblemDifficulty difficulty) {
        return problemRepository.findRandomProblemByDifficulty(difficulty.name());
    }

    /**
     * 문제 통계 조회
     */
    public ProblemStatistics getProblemStatistics() {
        List<Problem> allProblems = problemRepository.findAll();
        
        long totalProblems = allProblems.size();
        long activeProblems = allProblems.stream().filter(Problem::isActive).count();
        long totalSubmissions = allProblems.stream()
                .mapToLong(p -> p.getTotalSubmissions() != null ? p.getTotalSubmissions() : 0)
                .sum();
        long correctSubmissions = allProblems.stream()
                .mapToLong(p -> p.getCorrectSubmissions() != null ? p.getCorrectSubmissions() : 0)
                .sum();
        
        double overallSuccessRate = totalSubmissions > 0 ? (double) correctSubmissions / totalSubmissions * 100 : 0.0;
        
        return ProblemStatistics.builder()
                .totalProblems(totalProblems)
                .activeProblems(activeProblems)
                .totalSubmissions(totalSubmissions)
                .correctSubmissions(correctSubmissions)
                .overallSuccessRate(overallSuccessRate)
                .build();
    }

    /**
     * 문제 통계 DTO
     */
    public static class ProblemStatistics {
        private final long totalProblems;
        private final long activeProblems;
        private final long totalSubmissions;
        private final long correctSubmissions;
        private final double overallSuccessRate;

        public ProblemStatistics(long totalProblems, long activeProblems, long totalSubmissions, 
                               long correctSubmissions, double overallSuccessRate) {
            this.totalProblems = totalProblems;
            this.activeProblems = activeProblems;
            this.totalSubmissions = totalSubmissions;
            this.correctSubmissions = correctSubmissions;
            this.overallSuccessRate = overallSuccessRate;
        }

        // Getters
        public long getTotalProblems() { return totalProblems; }
        public long getActiveProblems() { return activeProblems; }
        public long getTotalSubmissions() { return totalSubmissions; }
        public long getCorrectSubmissions() { return correctSubmissions; }
        public double getOverallSuccessRate() { return overallSuccessRate; }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private long totalProblems;
            private long activeProblems;
            private long totalSubmissions;
            private long correctSubmissions;
            private double overallSuccessRate;

            public Builder totalProblems(long totalProblems) {
                this.totalProblems = totalProblems;
                return this;
            }

            public Builder activeProblems(long activeProblems) {
                this.activeProblems = activeProblems;
                return this;
            }

            public Builder totalSubmissions(long totalSubmissions) {
                this.totalSubmissions = totalSubmissions;
                return this;
            }

            public Builder correctSubmissions(long correctSubmissions) {
                this.correctSubmissions = correctSubmissions;
                return this;
            }

            public Builder overallSuccessRate(double overallSuccessRate) {
                this.overallSuccessRate = overallSuccessRate;
                return this;
            }

            public ProblemStatistics build() {
                return new ProblemStatistics(totalProblems, activeProblems, totalSubmissions, 
                                           correctSubmissions, overallSuccessRate);
            }
        }
    }
} 