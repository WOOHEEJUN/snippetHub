package com.snippethub.api.controller;

import com.snippethub.api.domain.Problem;
import com.snippethub.api.domain.ProblemCategory;
import com.snippethub.api.domain.ProblemDifficulty;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.problem.ProblemResponseDto;
import com.snippethub.api.service.AICodeEvaluationService;
import com.snippethub.api.service.AIProblemGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIProblemGenerationService aiProblemGenerationService;
    private final AICodeEvaluationService aiCodeEvaluationService;

    /**
     * AI 문제 생성
     */
    @PostMapping("/problems/generate")
    public ResponseEntity<ApiResponse<ProblemResponseDto>> generateProblem(
            @RequestParam ProblemDifficulty difficulty,
            @RequestParam ProblemCategory category,
            @AuthenticationPrincipal UserDetails userDetails) {

        Optional<Problem> generatedProblem = aiProblemGenerationService.generateProblem(difficulty, category);
        
        if (generatedProblem.isPresent()) {
            ProblemResponseDto responseDto = new ProblemResponseDto(generatedProblem.get());
            return ResponseEntity.ok(ApiResponse.success("AI가 새로운 문제를 생성했습니다.", responseDto));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("문제 생성에 실패했습니다."));
        }
    }

    /**
     * 일일 과제용 AI 문제 생성
     */
    @PostMapping("/problems/generate-daily")
    public ResponseEntity<ApiResponse<ProblemResponseDto>> generateDailyProblem(
            @AuthenticationPrincipal UserDetails userDetails) {

        Optional<Problem> generatedProblem = aiProblemGenerationService.generateDailyProblem();
        
        if (generatedProblem.isPresent()) {
            ProblemResponseDto responseDto = new ProblemResponseDto(generatedProblem.get());
            return ResponseEntity.ok(ApiResponse.success("오늘의 AI 문제가 생성되었습니다.", responseDto));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("일일 문제 생성에 실패했습니다."));
        }
    }

    /**
     * 개인화된 AI 문제 생성
     */
    @PostMapping("/problems/generate-personalized")
    public ResponseEntity<ApiResponse<ProblemResponseDto>> generatePersonalizedProblem(
            @RequestParam(defaultValue = "3") int userLevel,
            @AuthenticationPrincipal UserDetails userDetails) {

        // 실제 구현에서는 userDetails에서 userId를 추출
        Long userId = 1L; // 임시 값
        
        Optional<Problem> generatedProblem = aiProblemGenerationService.generatePersonalizedProblem(userId, userLevel);
        
        if (generatedProblem.isPresent()) {
            ProblemResponseDto responseDto = new ProblemResponseDto(generatedProblem.get());
            return ResponseEntity.ok(ApiResponse.success("개인화된 AI 문제가 생성되었습니다.", responseDto));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("개인화된 문제 생성에 실패했습니다."));
        }
    }

    /**
     * 코드 품질 평가
     */
    @PostMapping("/evaluate/code-quality")
    public ResponseEntity<ApiResponse<AICodeEvaluationService.CodeQualityReport>> evaluateCodeQuality(
            @RequestParam String code,
            @RequestParam String language,
            @RequestParam Long problemId,
            @AuthenticationPrincipal UserDetails userDetails) {

        // 실제 구현에서는 problemId로 Problem을 조회
        Problem problem = Problem.builder()
            .title("테스트 문제")
            .description("테스트")
            .difficulty(ProblemDifficulty.EASY)
            .category(ProblemCategory.ALGORITHM)
            .build();

        AICodeEvaluationService.CodeQualityReport report = 
            aiCodeEvaluationService.evaluateCodeQuality(code, language, problem);
        
        return ResponseEntity.ok(ApiResponse.success("코드 품질 평가가 완료되었습니다.", report));
    }

    /**
     * 코드 최적화 제안
     */
    @PostMapping("/suggest/optimization")
    public ResponseEntity<ApiResponse<AICodeEvaluationService.CodeOptimizationSuggestion>> suggestOptimization(
            @RequestParam String code,
            @RequestParam String language,
            @RequestParam Long problemId,
            @AuthenticationPrincipal UserDetails userDetails) {

        // 실제 구현에서는 problemId로 Problem을 조회
        Problem problem = Problem.builder()
            .title("테스트 문제")
            .description("테스트")
            .difficulty(ProblemDifficulty.EASY)
            .category(ProblemCategory.ALGORITHM)
            .build();

        AICodeEvaluationService.CodeOptimizationSuggestion suggestion = 
            aiCodeEvaluationService.suggestOptimization(code, language, problem);
        
        return ResponseEntity.ok(ApiResponse.success("코드 최적화 제안이 완료되었습니다.", suggestion));
    }

    /**
     * 코드 설명 생성
     */
    @PostMapping("/explain/code")
    public ResponseEntity<ApiResponse<String>> explainCode(
            @RequestParam String code,
            @RequestParam String language,
            @AuthenticationPrincipal UserDetails userDetails) {

        String explanation = aiCodeEvaluationService.generateCodeExplanation(code, language);
        
        return ResponseEntity.ok(ApiResponse.success("코드 설명이 생성되었습니다.", explanation));
    }

    /**
     * 학습 경로 제안
     */
    @PostMapping("/suggest/learning-path")
    public ResponseEntity<ApiResponse<AICodeEvaluationService.LearningPathSuggestion>> suggestLearningPath(
            @AuthenticationPrincipal UserDetails userDetails) {

        // 실제 구현에서는 사용자의 제출 이력을 조회
        AICodeEvaluationService.LearningPathSuggestion suggestion = 
            aiCodeEvaluationService.suggestLearningPath(1L, java.util.List.of());
        
        return ResponseEntity.ok(ApiResponse.success("학습 경로 제안이 완료되었습니다.", suggestion));
    }
} 