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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
     * DTO로부터 문제 생성
     */
    @Transactional
    public ProblemResponseDto createProblem(Object requestDto, String userEmail) {
        // requestDto를 Map 형태로 파싱하여 Problem 엔티티 생성
        try {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> data = (java.util.Map<String, Object>) requestDto;
            
            String title = (String) data.getOrDefault("title", "새로운 문제");
            String description = (String) data.getOrDefault("description", "문제 설명");
            String difficultyStr = (String) data.getOrDefault("difficulty", "MEDIUM");
            Boolean isAIGenerated = (Boolean) data.getOrDefault("isAIGenerated", false);
            
            ProblemDifficulty difficulty;
            try {
                difficulty = ProblemDifficulty.valueOf(difficultyStr.toUpperCase());
            } catch (Exception e) {
                difficulty = ProblemDifficulty.MEDIUM;
            }
            Problem problem = Problem.builder()
                    .title(title)
                    .description(description)
                    .problemStatement((String) data.getOrDefault("problemStatement", "문제를 해결하세요."))
                    .inputFormat((String) data.getOrDefault("inputFormat", "입력 형식"))
                    .outputFormat((String) data.getOrDefault("outputFormat", "출력 형식"))
                    .constraints((String) data.getOrDefault("constraints", "제약 조건"))
                    .sampleInput((String) data.getOrDefault("sampleInput", "예시 입력"))
                    .sampleOutput((String) data.getOrDefault("sampleOutput", "예시 출력"))
                    .solutionTemplate((String) data.getOrDefault("solutionTemplate", "// 솔루션 템플릿"))
                    .difficulty(difficulty)
                    .category(ProblemCategory.ALGORITHM)
                    .timeLimit(1000)
                    .memoryLimit(128)
                    .build();
            
            Problem savedProblem = problemRepository.save(problem);
            log.info("사용자 {}가 새로운 문제를 생성했습니다: {} (AI 생성: {})", userEmail, savedProblem.getTitle(), isAIGenerated);
            return new ProblemResponseDto(savedProblem);
        } catch (Exception e) {
            log.error("문제 생성 중 오류 발생", e);
            // 기본 문제 생성
            Problem problem = Problem.builder()
                    .title("기본 문제")
                    .description("기본 문제입니다.")
                    .problemStatement("문제를 해결하세요.")
                    .inputFormat("입력 형식")
                    .outputFormat("출력 형식")
                    .constraints("제약 조건")
                    .sampleInput("예시 입력")
                    .sampleOutput("예시 출력")
                    .solutionTemplate("// 솔루션 템플릿")
                    .difficulty(ProblemDifficulty.EASY)
                    .category(ProblemCategory.ALGORITHM)
                    .timeLimit(1000)
                    .memoryLimit(128)
                    .build();
            
            Problem savedProblem = problemRepository.save(problem);
            return new ProblemResponseDto(savedProblem);
        }
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
     * 필터링을 지원하는 활성화된 문제 목록 조회
     */
    public Page<ProblemResponseDto> getActiveProblemsWithFilters(String difficulty, String category, String search, Pageable pageable) {
        Page<Problem> problems;
        
        // 모든 필터가 없는 경우
        if (isEmpty(difficulty) && isEmpty(category) && isEmpty(search)) {
            problems = problemRepository.findByIsActiveTrue(pageable);
        }
        // 검색어만 있는 경우
        else if (!isEmpty(search) && isEmpty(difficulty) && isEmpty(category)) {
            problems = problemRepository.findByTitleContainingIgnoreCaseAndIsActiveTrue(search, pageable);
        }
        // 난이도만 있는 경우
        else if (!isEmpty(difficulty) && isEmpty(category) && isEmpty(search)) {
            ProblemDifficulty difficultyEnum = ProblemDifficulty.valueOf(difficulty.toUpperCase());
            problems = problemRepository.findByDifficultyAndIsActiveTrue(difficultyEnum, pageable);
        }
        // 카테고리만 있는 경우
        else if (!isEmpty(category) && isEmpty(difficulty) && isEmpty(search)) {
            ProblemCategory categoryEnum = ProblemCategory.valueOf(category.toUpperCase());
            problems = problemRepository.findByCategoryAndIsActiveTrue(categoryEnum, pageable);
        }
        // 난이도 + 카테고리
        else if (!isEmpty(difficulty) && !isEmpty(category) && isEmpty(search)) {
            ProblemDifficulty difficultyEnum = ProblemDifficulty.valueOf(difficulty.toUpperCase());
            ProblemCategory categoryEnum = ProblemCategory.valueOf(category.toUpperCase());
            problems = problemRepository.findByDifficultyAndCategoryAndIsActiveTrue(difficultyEnum, categoryEnum, pageable);
        }
        // 복합 필터링 - 새로운 통합 쿼리 사용
        else {
            try {
                ProblemDifficulty difficultyEnum = !isEmpty(difficulty) ? ProblemDifficulty.valueOf(difficulty.toUpperCase()) : null;
                ProblemCategory categoryEnum = !isEmpty(category) ? ProblemCategory.valueOf(category.toUpperCase()) : null;
                String searchKeyword = !isEmpty(search) ? search.trim() : null;
                
                problems = problemRepository.findByFilters(difficultyEnum, categoryEnum, searchKeyword, pageable);
            } catch (Exception e) {
                log.error("복합 필터링 중 오류 발생", e);
                problems = problemRepository.findByIsActiveTrue(pageable);
            }
        }
        
        return problems.map(ProblemResponseDto::new);
    }
    
    private boolean isEmpty(String str) {
        return str == null || str.trim().isEmpty();
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
     * 사용자 맞춤 추천 문제 조회
     */
    public List<ProblemResponseDto> getRecommendedProblems(String userEmail) {
        // 임시로 랜덤 문제 5개를 추천 (실제로는 사용자 수준과 학습 패턴을 분석해야 함)
        List<Problem> randomProblems = problemRepository.findRandomActiveProblems(5);
        return randomProblems.stream()
                .map(ProblemResponseDto::new)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * 사용자 문제 해결 통계 조회
     */
    public UserProblemStats getUserProblemStats(String userEmail) {
        try {
            // 실제 데이터베이스에서 사용자 제출 이력 분석
            // TODO: UserRepository와 SubmissionRepository 연동 필요
            
            // 기본 통계 계산
            int solvedProblems = calculateSolvedProblems(userEmail);
            double successRate = calculateSuccessRate(userEmail);
            String currentLevel = determineUserLevel(solvedProblems, successRate);
            int streak = calculateStreak(userEmail);
            
            // 난이도별 통계
            int easySolved = countSolvedByDifficulty(userEmail, ProblemDifficulty.EASY);
            int mediumSolved = countSolvedByDifficulty(userEmail, ProblemDifficulty.MEDIUM);
            int hardSolved = countSolvedByDifficulty(userEmail, ProblemDifficulty.HARD);
            
            // 카테고리별 진도
            List<CategoryProgress> categoryProgress = calculateCategoryProgress(userEmail);
            
            return new UserProblemStats(
                solvedProblems,
                successRate,
                currentLevel,
                streak,
                easySolved,
                mediumSolved,
                hardSolved,
                categoryProgress
            );
        } catch (Exception e) {
            log.error("사용자 통계 조회 중 오류 발생: {}", userEmail, e);
            // 오류 시 기본값 반환
            return new UserProblemStats(0, 0.0, "BRONZE", 0, 0, 0, 0, List.of());
        }
    }
    
    private int calculateSolvedProblems(String userEmail) {
        // TODO: 실제 구현에서는 ProblemSubmissionRepository에서 조회
        // SELECT COUNT(DISTINCT problem_id) FROM submissions WHERE user_email = ? AND status = 'ACCEPTED'
        return 0; // 임시
    }
    
    private double calculateSuccessRate(String userEmail) {
        // TODO: 실제 구현에서는 성공한 제출 / 전체 제출 비율 계산
        return 0.0; // 임시
    }
    
    private String determineUserLevel(int solvedProblems, double successRate) {
        if (solvedProblems >= 100 && successRate >= 0.8) return "PLATINUM";
        if (solvedProblems >= 50 && successRate >= 0.7) return "GOLD";
        if (solvedProblems >= 20 && successRate >= 0.6) return "SILVER";
        if (solvedProblems >= 5) return "BRONZE";
        return "NEWBIE";
    }
    
    private int calculateStreak(String userEmail) {
        // TODO: 연속 해결 일수 계산
        return 0;
    }
    
    private int countSolvedByDifficulty(String userEmail, ProblemDifficulty difficulty) {
        // TODO: 난이도별 해결 문제 수 계산
        return 0;
    }
    
    private List<CategoryProgress> calculateCategoryProgress(String userEmail) {
        // TODO: 카테고리별 진도 계산
        return List.of(
            new CategoryProgress("ALGORITHM", 0, calculateTotalByCategory(ProblemCategory.ALGORITHM)),
            new CategoryProgress("DATA_STRUCTURE", 0, calculateTotalByCategory(ProblemCategory.DATA_STRUCTURE)),
            new CategoryProgress("STRING", 0, calculateTotalByCategory(ProblemCategory.STRING)),
            new CategoryProgress("MATH", 0, calculateTotalByCategory(ProblemCategory.MATH))
        );
    }
    
    private int calculateTotalByCategory(ProblemCategory category) {
        // 카테고리별 전체 문제 수 계산
        return Math.toIntExact(problemRepository.countByCategory(category));
    }

    /**
     * 사용자가 저장한 문제 목록 조회
     */
    public List<ProblemResponseDto> getSavedProblems(String userEmail) {
        try {
            // TODO: 실제로는 사용자가 북마크한 문제들을 조회해야 함 (User-Problem 관계 테이블 필요)
            // 임시로 최근 생성된 활성 문제 5개 반환
            // 최근 생성된 활성 문제 5개 조회
            Pageable pageable = PageRequest.of(0, 5);
            List<Problem> recentProblems = problemRepository.findTop5ByIsActiveTrueOrderByCreatedAtDesc(pageable);
            if (recentProblems.isEmpty()) {
                // 랜덤 활성 문제로 fallback
                recentProblems = problemRepository.findRandomActiveProblems(3);
            }
            return recentProblems.stream()
                    .map(ProblemResponseDto::new)
                    .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            log.error("저장된 문제 목록 조회 중 오류 발생", e);
            return new java.util.ArrayList<>();
        }
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

    /**
     * 사용자 문제 해결 통계 데이터 클래스
     */
    public static class UserProblemStats {
        private final int solvedProblems;
        private final double successRate;
        private final String currentLevel;
        private final int streak;
        private final int easySolved;
        private final int mediumSolved;
        private final int hardSolved;
        private final List<CategoryProgress> categoryProgress;

        public UserProblemStats(int solvedProblems, double successRate, String currentLevel, 
                              int streak, int easySolved, int mediumSolved, int hardSolved, 
                              List<CategoryProgress> categoryProgress) {
            this.solvedProblems = solvedProblems;
            this.successRate = successRate;
            this.currentLevel = currentLevel;
            this.streak = streak;
            this.easySolved = easySolved;
            this.mediumSolved = mediumSolved;
            this.hardSolved = hardSolved;
            this.categoryProgress = categoryProgress;
        }

        // Getters
        public int getSolvedProblems() { return solvedProblems; }
        public double getSuccessRate() { return successRate; }
        public String getCurrentLevel() { return currentLevel; }
        public int getStreak() { return streak; }
        public int getEasySolved() { return easySolved; }
        public int getMediumSolved() { return mediumSolved; }
        public int getHardSolved() { return hardSolved; }
        public List<CategoryProgress> getCategoryProgress() { return categoryProgress; }
    }

    /**
     * 카테고리별 진행률 데이터 클래스
     */
    public static class CategoryProgress {
        private final String category;
        private final int solved;
        private final int total;

        public CategoryProgress(String category, int solved, int total) {
            this.category = category;
            this.solved = solved;
            this.total = total;
        }

        // Getters
        public String getCategory() { return category; }
        public int getSolved() { return solved; }
        public int getTotal() { return total; }
        
        public double getProgress() {
            return total > 0 ? (double) solved / total * 100 : 0;
        }
    }
} 