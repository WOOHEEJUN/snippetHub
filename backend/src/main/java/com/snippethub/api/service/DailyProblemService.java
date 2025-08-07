package com.snippethub.api.service;

import com.snippethub.api.domain.DailyProblem;
import com.snippethub.api.domain.Problem;
import com.snippethub.api.dto.problem.ProblemResponseDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.repository.DailyProblemRepository;
import com.snippethub.api.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class DailyProblemService {

    private final DailyProblemRepository dailyProblemRepository;
    private final ProblemRepository problemRepository;
    private final ProblemService problemService;

    /**
     * 오늘의 일일 문제 조회
     */
    public Optional<ProblemResponseDto> getTodayProblem() {
        LocalDate today = LocalDate.now();
        Optional<DailyProblem> dailyProblem = dailyProblemRepository.findTodayProblem(today);
        return dailyProblem.map(dp -> new ProblemResponseDto(dp.getProblem()));
    }

    /**
     * 특정 날짜의 일일 문제 조회
     */
    public Optional<ProblemResponseDto> getProblemByDate(LocalDate date) {
        Optional<DailyProblem> dailyProblem = dailyProblemRepository.findByProblemDateAndIsActiveTrue(date);
        return dailyProblem.map(dp -> new ProblemResponseDto(dp.getProblem()));
    }

    /**
     * 일일 문제 생성 (AI 또는 수동)
     */
    @Transactional
    public DailyProblem createDailyProblem(LocalDate problemDate, Long problemId) {
        // 이미 해당 날짜에 활성화된 문제가 있는지 확인
        Optional<DailyProblem> existingDailyProblem = dailyProblemRepository.findByProblemDateAndIsActiveTrue(problemDate);
        if (existingDailyProblem.isPresent()) {
            // 기존 문제가 있으면 그대로 반환
            log.info("{} 날짜에 이미 활성화된 일일 문제가 있습니다", problemDate);
            return existingDailyProblem.get();
        }

        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROBLEM_NOT_FOUND));

        DailyProblem dailyProblem = DailyProblem.builder()
                .problem(problem)
                .problemDate(problemDate)
                .build();

        DailyProblem savedDailyProblem = dailyProblemRepository.save(dailyProblem);
        log.info("{} 날짜의 일일 문제가 생성되었습니다", problemDate);
        
        return savedDailyProblem;
    }

    /**
     * 랜덤 문제로 일일 문제 생성
     */
    @Transactional
    public DailyProblem createDailyProblemWithRandomProblem(LocalDate problemDate) {
        Optional<Problem> randomProblem = problemService.getRandomProblem();
        
        if (randomProblem.isEmpty()) {
            throw new BusinessException(ErrorCode.PROBLEM_NOT_FOUND);
        }

        return createDailyProblem(problemDate, randomProblem.get().getId());
    }

    /**
     * 이번 주 일일 문제들 조회
     */
    public List<ProblemResponseDto> getThisWeekProblems() {
        LocalDate startOfWeek = LocalDate.now().minusDays(6); // 오늘 포함 7일
        LocalDate endOfWeek = LocalDate.now();
        
        List<DailyProblem> dailyProblems = dailyProblemRepository.findByProblemDateBetweenOrderByProblemDateDesc(startOfWeek, endOfWeek);
        return dailyProblems.stream()
                .map(dp -> new ProblemResponseDto(dp.getProblem()))
                .toList();
    }

    /**
     * 이번 달 일일 문제들 조회
     */
    public List<ProblemResponseDto> getThisMonthProblems() {
        List<DailyProblem> dailyProblems = dailyProblemRepository.findThisMonthProblems();
        return dailyProblems.stream()
                .map(dp -> new ProblemResponseDto(dp.getProblem()))
                .toList();
    }

    /**
     * 일일 문제 참여자 수 증가
     */
    @Transactional
    public void incrementParticipants(LocalDate problemDate, boolean isCorrect) {
        Optional<DailyProblem> dailyProblem = dailyProblemRepository.findByProblemDate(problemDate);
        
        if (dailyProblem.isPresent()) {
            dailyProblem.get().incrementParticipants(isCorrect);
            dailyProblemRepository.save(dailyProblem.get());
        }
    }

    /**
     * 일일 문제 통계 조회
     */
    public DailyProblemStatistics getDailyProblemStatistics() {
        List<DailyProblem> allDailyProblems = dailyProblemRepository.findAll();
        
        long totalDailyProblems = allDailyProblems.size();
        long activeDailyProblems = allDailyProblems.stream().filter(DailyProblem::isActive).count();
        long totalParticipants = allDailyProblems.stream()
                .mapToLong(dp -> dp.getTotalParticipants() != null ? dp.getTotalParticipants() : 0)
                .sum();
        long correctParticipants = allDailyProblems.stream()
                .mapToLong(dp -> dp.getCorrectParticipants() != null ? dp.getCorrectParticipants() : 0)
                .sum();
        
        double overallSuccessRate = totalParticipants > 0 ? (double) correctParticipants / totalParticipants * 100 : 0.0;
        
        return DailyProblemStatistics.builder()
                .totalDailyProblems(totalDailyProblems)
                .activeDailyProblems(activeDailyProblems)
                .totalParticipants(totalParticipants)
                .correctParticipants(correctParticipants)
                .overallSuccessRate(overallSuccessRate)
                .build();
    }

    /**
     * 일일 문제 비활성화
     */
    @Transactional
    public void deactivateDailyProblem(LocalDate problemDate) {
        Optional<DailyProblem> dailyProblem = dailyProblemRepository.findByProblemDate(problemDate);
        
        if (dailyProblem.isPresent()) {
            dailyProblem.get().setActive(false);
            dailyProblemRepository.save(dailyProblem.get());
            log.info("{} 날짜의 일일 문제가 비활성화되었습니다.", problemDate);
        }
    }

    /**
     * 일일 문제 통계 DTO
     */
    public static class DailyProblemStatistics {
        private final long totalDailyProblems;
        private final long activeDailyProblems;
        private final long totalParticipants;
        private final long correctParticipants;
        private final double overallSuccessRate;

        public DailyProblemStatistics(long totalDailyProblems, long activeDailyProblems, long totalParticipants,
                                    long correctParticipants, double overallSuccessRate) {
            this.totalDailyProblems = totalDailyProblems;
            this.activeDailyProblems = activeDailyProblems;
            this.totalParticipants = totalParticipants;
            this.correctParticipants = correctParticipants;
            this.overallSuccessRate = overallSuccessRate;
        }

        // Getters
        public long getTotalDailyProblems() { return totalDailyProblems; }
        public long getActiveDailyProblems() { return activeDailyProblems; }
        public long getTotalParticipants() { return totalParticipants; }
        public long getCorrectParticipants() { return correctParticipants; }
        public double getOverallSuccessRate() { return overallSuccessRate; }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private long totalDailyProblems;
            private long activeDailyProblems;
            private long totalParticipants;
            private long correctParticipants;
            private double overallSuccessRate;

            public Builder totalDailyProblems(long totalDailyProblems) {
                this.totalDailyProblems = totalDailyProblems;
                return this;
            }

            public Builder activeDailyProblems(long activeDailyProblems) {
                this.activeDailyProblems = activeDailyProblems;
                return this;
            }

            public Builder totalParticipants(long totalParticipants) {
                this.totalParticipants = totalParticipants;
                return this;
            }

            public Builder correctParticipants(long correctParticipants) {
                this.correctParticipants = correctParticipants;
                return this;
            }

            public Builder overallSuccessRate(double overallSuccessRate) {
                this.overallSuccessRate = overallSuccessRate;
                return this;
            }

            public DailyProblemStatistics build() {
                return new DailyProblemStatistics(totalDailyProblems, activeDailyProblems, totalParticipants,
                                                correctParticipants, overallSuccessRate);
            }
        }
    }
} 