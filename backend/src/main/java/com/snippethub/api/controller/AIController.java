package com.snippethub.api.controller;

import com.snippethub.api.domain.Problem;
import com.snippethub.api.domain.ProblemCategory;
import com.snippethub.api.domain.ProblemDifficulty;
import com.snippethub.api.dto.ApiResponse;
import com.snippethub.api.dto.AICodeEvaluationRequest;
import com.snippethub.api.dto.problem.ProblemResponseDto;
import com.snippethub.api.service.AICodeEvaluationService;
import com.snippethub.api.service.AIProblemGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
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
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String additionalRequirements) {

        Optional<Problem> generatedProblem = aiProblemGenerationService.generateProblem(difficulty, category, description, additionalRequirements);
        
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
    public ResponseEntity<ApiResponse<ProblemResponseDto>> generateDailyProblem() {

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
            @RequestParam(defaultValue = "3") int userLevel) {

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
            @RequestBody AICodeEvaluationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        // 실제 구현에서는 problemId로 Problem을 조회
        Problem problem = new Problem("테스트 문제", "테스트", null, null, null, null, null, null, null, ProblemDifficulty.EASY, ProblemCategory.ALGORITHM, 1000, 128);

        AICodeEvaluationService.CodeQualityReport report = 
            aiCodeEvaluationService.evaluateCodeQuality(request.getCode(), request.getLanguage(), problem);
        
        return ResponseEntity.ok(ApiResponse.success("코드 품질 평가가 완료되었습니다.", report));
    }

    /**
     * 코드 최적화 제안
     */
    @PostMapping("/suggest/optimization")
    public ResponseEntity<ApiResponse<AICodeEvaluationService.CodeOptimizationSuggestion>> suggestOptimization(
            @RequestBody AICodeEvaluationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        // 실제 구현에서는 problemId로 Problem을 조회
        Problem problem = new Problem("테스트 문제", "테스트", null, null, null, null, null, null, null, ProblemDifficulty.EASY, ProblemCategory.ALGORITHM, 1000, 128);

        AICodeEvaluationService.CodeOptimizationSuggestion suggestion = 
            aiCodeEvaluationService.suggestOptimization(request.getCode(), request.getLanguage(), problem);
        
        return ResponseEntity.ok(ApiResponse.success("코드 최적화 제안이 완료되었습니다.", suggestion));
    }

    /**
     * 코드 설명 생성
     */
    @PostMapping("/explain/code")
    public ResponseEntity<ApiResponse<String>> explainCode(
            @RequestBody AICodeEvaluationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String explanation = aiCodeEvaluationService.generateCodeExplanation(request.getCode(), request.getLanguage());
        
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

    /**
     * 스니펫 코드 평가
     */
    @PostMapping("/evaluate-code")
    public ResponseEntity<ApiResponse<Object>> evaluateCode(
            @RequestBody AICodeEvaluationRequest request) {

        try {
            // 임시 응답 데이터 (실제로는 AI 서비스를 호출해야 함)
            Object evaluationResult = Map.of(
                "overallScore", 85,
                "readabilityScore", 90,
                "performanceScore", 80,
                "securityScore", 85,
                "suggestions", List.of(
                    Map.of("type", "성능", "content", "변수명을 더 명확하게 작성하세요."),
                    Map.of("type", "가독성", "content", "주석을 추가하여 코드의 의도를 명확히 하세요.")
                ),
                "improvedCode", request.getCode() + "\n// 개선된 코드 예시"
            );
            
            return ResponseEntity.ok(ApiResponse.success("코드 평가가 완료되었습니다.", evaluationResult));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("코드 평가 중 오류가 발생했습니다."));
        }
    }
} 