package com.snippethub.api.service;

import com.snippethub.api.domain.Problem;
import com.snippethub.api.domain.ProblemSubmission;
import com.snippethub.api.domain.SubmissionStatus;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.ExecutionRequest;
import com.snippethub.api.dto.ExecutionResponse;
import com.snippethub.api.dto.problem.ProblemSubmissionRequestDto;
import com.snippethub.api.dto.problem.ProblemSubmissionResponseDto;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.repository.ProblemRepository;
import com.snippethub.api.repository.ProblemSubmissionRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ProblemSubmissionService {

    private final ProblemSubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final ExecutionService executionService;
    private final PointService pointService;

    /**
     * 코드 제출 처리
     */
    @Transactional
    public ProblemSubmissionResponseDto submitCode(Long userId, Long problemId, ProblemSubmissionRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROBLEM_NOT_FOUND));

        // 코드 실행 및 결과 확인
        SubmissionResult result = executeAndValidateCode(requestDto.getCode(), requestDto.getLanguage(), problem);
        
        // 제출 저장
        ProblemSubmission submission = ProblemSubmission.builder()
                .user(user)
                .problem(problem)
                .submittedCode(requestDto.getCode())
                .language(requestDto.getLanguage())
                .status(result.getStatus())
                .build();

        // 실행 결과 업데이트
        submission.updateResult(
                result.getStatus(),
                result.getExecutionTime(),
                result.getMemoryUsed(),
                result.getTestCasesPassed(),
                result.getTotalTestCases(),
                result.getErrorMessage(),
                result.getOutput()
        );

        ProblemSubmission savedSubmission = submissionRepository.save(submission);

        // 문제 통계 업데이트
        problem.incrementSubmissions(result.getStatus() == SubmissionStatus.ACCEPTED);

        // 포인트 지급 (정답인 경우)
        if (result.getStatus() == SubmissionStatus.ACCEPTED) {
            try {
                pointService.awardPointsForProblemSolved(userId, problem.getDifficulty(), savedSubmission.getId());
            } catch (Exception e) {
                // 포인트 시스템 오류가 제출에 영향을 주지 않도록 처리
                log.error("포인트 지급 중 오류 발생: {}", e.getMessage());
            }
        }

        log.info("사용자 {}가 문제 {}에 코드를 제출했습니다. 결과: {}", 
                user.getNickname(), problem.getTitle(), result.getStatus());

        return new ProblemSubmissionResponseDto(savedSubmission);
    }

    /**
     * 사용자의 제출 이력 조회
     */
    public Page<ProblemSubmissionResponseDto> getUserSubmissions(Long userId, Pageable pageable) {
        Page<ProblemSubmission> submissions = submissionRepository.findByUserIdOrderBySubmittedAtDesc(userId, pageable);
        return submissions.map(ProblemSubmissionResponseDto::new);
    }

    /**
     * 특정 문제의 사용자 제출 이력 조회
     */
    public Page<ProblemSubmissionResponseDto> getUserSubmissionsForProblem(Long userId, Long problemId, Pageable pageable) {
        Page<ProblemSubmission> submissions = submissionRepository.findByUserIdAndProblemIdOrderBySubmittedAtDesc(userId, problemId, pageable);
        return submissions.map(ProblemSubmissionResponseDto::new);
    }

    /**
     * 사용자의 정답 제출만 조회
     */
    public Page<ProblemSubmissionResponseDto> getUserCorrectSubmissions(Long userId, Pageable pageable) {
        Page<ProblemSubmission> submissions = submissionRepository.findByUserIdAndStatusOrderBySubmittedAtDesc(userId, SubmissionStatus.ACCEPTED, pageable);
        return submissions.map(ProblemSubmissionResponseDto::new);
    }

    /**
     * 특정 문제의 모든 제출 조회
     */
    public Page<ProblemSubmissionResponseDto> getProblemSubmissions(Long problemId, Pageable pageable) {
        Page<ProblemSubmission> submissions = submissionRepository.findByProblemIdOrderBySubmittedAtDesc(problemId, pageable);
        return submissions.map(ProblemSubmissionResponseDto::new);
    }

    /**
     * 사용자가 특정 문제를 풀었는지 확인
     */
    public boolean hasUserSolvedProblem(Long userId, Long problemId) {
        return submissionRepository.existsByUserIdAndProblemIdAndStatus(userId, problemId, SubmissionStatus.ACCEPTED);
    }

    /**
     * 사용자의 최근 제출 조회
     */
    public Optional<ProblemSubmissionResponseDto> getLatestSubmission(Long userId, Long problemId) {
        Optional<ProblemSubmission> submission = submissionRepository.findFirstByUserIdAndProblemIdOrderBySubmittedAtDesc(userId, problemId);
        return submission.map(ProblemSubmissionResponseDto::new);
    }

    /**
     * 사용자의 오늘 제출 수 조회
     */
    public Long getTodaySubmissionCount(Long userId) {
        return submissionRepository.countTodaySubmissionsByUser(userId);
    }

    /**
     * 코드 실행 및 검증
     */
    private SubmissionResult executeAndValidateCode(String code, String language, Problem problem) {
        try {
            // 기본 코드 실행 (ExecutionService의 execute 메서드 사용)
            ExecutionRequest request = new ExecutionRequest();
            request.setCode(code);
            request.setLanguage(language);
            request.setInput(""); // 문제별 입력은 나중에 확장
            
            ExecutionResponse executionResult = executionService.execute(request, null);
            
            // 문제별 검증 로직 (간단한 예시)
            boolean isCorrect = validateAgainstProblem(executionResult.getOutput(), problem);
            
            SubmissionStatus status = isCorrect ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER;
            
            return SubmissionResult.builder()
                    .status(status)
                    .executionTime(executionResult.getExecutionTime() != null ? executionResult.getExecutionTime().longValue() : null)
                    .memoryUsed(executionResult.getMemoryUsed() != null ? executionResult.getMemoryUsed().longValue() : null)
                    .testCasesPassed(isCorrect ? 1 : 0)
                    .totalTestCases(1)
                    .errorMessage(executionResult.getError())
                    .output(executionResult.getOutput())
                    .build();
                    
        } catch (Exception e) {
            log.error("코드 실행 중 오류 발생", e);
            return SubmissionResult.builder()
                    .status(SubmissionStatus.RUNTIME_ERROR)
                    .errorMessage(e.getMessage())
                    .build();
        }
    }

    /**
     * 문제별 검증 로직 (간단한 예시)
     */
    private boolean validateAgainstProblem(String output, Problem problem) {
        // 실제로는 더 복잡한 검증 로직이 필요
        // 예: 테스트 케이스와 비교, 정확한 출력 형식 확인 등
        if (problem.getSampleOutput() != null) {
            return output.trim().equals(problem.getSampleOutput().trim());
        }
        return true; // 기본적으로 통과
    }

    /**
     * 제출 결과 DTO
     */
    public static class SubmissionResult {
        private final SubmissionStatus status;
        private final Long executionTime;
        private final Long memoryUsed;
        private final Integer testCasesPassed;
        private final Integer totalTestCases;
        private final String errorMessage;
        private final String output;

        public SubmissionResult(SubmissionStatus status, Long executionTime, Long memoryUsed,
                              Integer testCasesPassed, Integer totalTestCases, String errorMessage, String output) {
            this.status = status;
            this.executionTime = executionTime;
            this.memoryUsed = memoryUsed;
            this.testCasesPassed = testCasesPassed;
            this.totalTestCases = totalTestCases;
            this.errorMessage = errorMessage;
            this.output = output;
        }

        // Getters
        public SubmissionStatus getStatus() { return status; }
        public Long getExecutionTime() { return executionTime; }
        public Long getMemoryUsed() { return memoryUsed; }
        public Integer getTestCasesPassed() { return testCasesPassed; }
        public Integer getTotalTestCases() { return totalTestCases; }
        public String getErrorMessage() { return errorMessage; }
        public String getOutput() { return output; }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private SubmissionStatus status = SubmissionStatus.PENDING;
            private Long executionTime;
            private Long memoryUsed;
            private Integer testCasesPassed = 0;
            private Integer totalTestCases = 0;
            private String errorMessage;
            private String output;

            public Builder status(SubmissionStatus status) {
                this.status = status;
                return this;
            }

            public Builder executionTime(Long executionTime) {
                this.executionTime = executionTime;
                return this;
            }

            public Builder memoryUsed(Long memoryUsed) {
                this.memoryUsed = memoryUsed;
                return this;
            }

            public Builder testCasesPassed(Integer testCasesPassed) {
                this.testCasesPassed = testCasesPassed;
                return this;
            }

            public Builder totalTestCases(Integer totalTestCases) {
                this.totalTestCases = totalTestCases;
                return this;
            }

            public Builder errorMessage(String errorMessage) {
                this.errorMessage = errorMessage;
                return this;
            }

            public Builder output(String output) {
                this.output = output;
                return this;
            }

            public SubmissionResult build() {
                return new SubmissionResult(status, executionTime, memoryUsed, 
                                         testCasesPassed, totalTestCases, errorMessage, output);
            }
        }
    }
} 