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
     * 템플릿 코드인지 확인하는 헬퍼 메서드
     */
    private boolean isTemplateCode(String code) {
        // 일반적인 템플릿 텍스트들
        String[] templateTexts = {
            "// 코드를 여기에 입력하세요",
            "# 코드를 여기에 입력하세요",
            "<!-- 코드를 여기에 입력하세요 -->",
            "/* 코드를 여기에 입력하세요 */",
            "// TODO: 구현하세요",
            "# TODO: 구현하세요",
            "<!-- TODO: 구현하세요 -->",
            "/* TODO: 구현하세요 */",
            "// Write your code here",
            "# Write your code here",
            "<!-- Write your code here -->",
            "/* Write your code here */",
            "print('Hello World')",
            "console.log('Hello World')",
            "System.out.println(\"Hello World\")",
            "printf(\"Hello World\");",
            "<html></html>",
            "body { }",
            "function() { }",
            "def function():",
            "public static void main"
        };
        
        String lowerCode = code.toLowerCase();
        for (String template : templateTexts) {
            if (lowerCode.contains(template.toLowerCase())) {
                return true;
            }
        }
        
        // 너무 간단한 코드들 (주석만 있거나, 빈 블록만 있는 경우)
        String codeWithoutComments = code.replaceAll("//.*", "")
                                        .replaceAll("/\\*.*?\\*/", "")
                                        .replaceAll("#.*", "")
                                        .replaceAll("<!--.*?-->", "")
                                        .trim();
        
        if (codeWithoutComments.length() < 5) {
            return true;
        }
        
        return false;
    }

    /**
     * 스니펫 코드 평가
     */
    @PostMapping("/evaluate-code")
    public ResponseEntity<ApiResponse<Object>> evaluateCode(
            @RequestBody AICodeEvaluationRequest request) {

        try {
            // 코드 검증: 빈 코드 체크
            String codeToEvaluate = request.getCode();
            if (codeToEvaluate == null || codeToEvaluate.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("평가할 코드를 입력해주세요. 빈 코드는 평가할 수 없습니다."));
            }
            
            // 템플릿 텍스트나 기본값 체크
            String trimmedCode = codeToEvaluate.trim();
            if (isTemplateCode(trimmedCode)) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("실제 코드를 입력해주세요. 기본 템플릿은 평가할 수 없습니다."));
            }
            
            // 코드 길이 체크 (너무 짧은 코드)
            if (trimmedCode.length() < 10) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("평가하기에는 코드가 너무 짧습니다. 최소 10자 이상의 코드를 입력해주세요."));
            }
            
            // 언어 검증
            if (request.getLanguage() == null || request.getLanguage().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("프로그래밍 언어를 지정해주세요."));
            }
            
            // AI 서비스를 통한 실제 코드 평가
            Problem problem = new Problem("코드 품질 평가", "코드 품질을 평가합니다.", null, null, null, null, null, null, null, ProblemDifficulty.MEDIUM, ProblemCategory.ALGORITHM, 1000, 128);
            AICodeEvaluationService.CodeQualityReport qualityReport = 
                aiCodeEvaluationService.evaluateCodeQuality(request.getCode(), request.getLanguage(), problem);
            
            // AI 응답을 그대로 사용 (각 세부 점수 포함)
            Object evaluationResult = Map.of(
                "overallScore", Math.round(qualityReport.getScore() * 10), // 8.5 -> 85점으로 변환
                "readabilityScore", Math.round(qualityReport.getReadabilityScore() * 10), // AI 가독성 점수
                "performanceScore", Math.round(qualityReport.getPerformanceScore() * 10), // AI 성능 점수
                "securityScore", Math.round(qualityReport.getSecurityScore() * 10), // AI 보안 점수
                "suggestions", qualityReport.getImprovements().stream()
                    .map(improvement -> Map.of(
                        "type", "💡", 
                        "content", improvement
                    )).toList(),
                "feedback", qualityReport.getFeedback(),
                "improvedCode", qualityReport.getImprovedCode() != null ? qualityReport.getImprovedCode() : "개선된 코드를 제공할 수 없습니다."
            );
            
            return ResponseEntity.ok(ApiResponse.success("코드 평가가 완료되었습니다.", evaluationResult));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("코드 평가 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
} 