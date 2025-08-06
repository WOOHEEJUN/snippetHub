package com.snippethub.api.service;

import com.snippethub.api.domain.Problem;
import com.snippethub.api.domain.ProblemSubmission;
import com.snippethub.api.domain.SubmissionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AICodeEvaluationService {

    /**
     * AI를 사용하여 코드 품질 평가
     */
    public CodeQualityReport evaluateCodeQuality(String code, String language, Problem problem) {
        try {
            String prompt = createCodeQualityPrompt(code, language, problem);
            String aiResponse = callAI(prompt);
            
            if (aiResponse != null) {
                return parseCodeQualityResponse(aiResponse);
            }
        } catch (Exception e) {
            log.error("AI 코드 품질 평가 중 오류 발생", e);
        }
        
        return CodeQualityReport.builder()
            .score(0.0)
            .feedback("AI 평가를 수행할 수 없습니다.")
            .build();
    }

    /**
     * AI를 사용하여 코드 최적화 제안
     */
    public CodeOptimizationSuggestion suggestOptimization(String code, String language, Problem problem) {
        try {
            String prompt = createOptimizationPrompt(code, language, problem);
            String aiResponse = callAI(prompt);
            
            if (aiResponse != null) {
                return parseOptimizationResponse(aiResponse);
            }
        } catch (Exception e) {
            log.error("AI 코드 최적화 제안 중 오류 발생", e);
        }
        
        return CodeOptimizationSuggestion.builder()
            .suggestions(List.of("AI 최적화 제안을 수행할 수 없습니다."))
            .build();
    }

    /**
     * AI를 사용하여 코드 설명 생성
     */
    public String generateCodeExplanation(String code, String language) {
        try {
            String prompt = createExplanationPrompt(code, language);
            String aiResponse = callAI(prompt);
            
            if (aiResponse != null) {
                return aiResponse;
            }
        } catch (Exception e) {
            log.error("AI 코드 설명 생성 중 오류 발생", e);
        }
        
        return "코드 설명을 생성할 수 없습니다.";
    }

    /**
     * AI를 사용하여 학습 경로 제안
     */
    public LearningPathSuggestion suggestLearningPath(Long userId, List<ProblemSubmission> submissions) {
        try {
            String prompt = createLearningPathPrompt(userId, submissions);
            String aiResponse = callAI(prompt);
            
            if (aiResponse != null) {
                return parseLearningPathResponse(aiResponse);
            }
        } catch (Exception e) {
            log.error("AI 학습 경로 제안 중 오류 발생", e);
        }
        
        return LearningPathSuggestion.builder()
            .suggestions(List.of("학습 경로를 제안할 수 없습니다."))
            .build();
    }

    /**
     * 코드 품질 평가 프롬프트 생성
     */
    private String createCodeQualityPrompt(String code, String language, Problem problem) {
        return """
            다음 코드의 품질을 평가해주세요:
            
            언어: %s
            문제: %s
            
            코드:
            %s
            
            다음 기준으로 평가해주세요:
            1. 가독성 (0-10점)
            2. 효율성 (0-10점)
            3. 최적화 (0-10점)
            4. 코딩 스타일 (0-10점)
            5. 에러 처리 (0-10점)
            
            JSON 형식으로 응답해주세요:
            {
                "overallScore": 8.5,
                "readability": 9,
                "efficiency": 8,
                "optimization": 7,
                "codingStyle": 9,
                "errorHandling": 8,
                "feedback": "전반적으로 좋은 코드입니다. 다만 메모리 사용량을 줄일 수 있습니다.",
                "improvements": ["메모리 최적화", "변수명 개선"]
            }
            """.formatted(language, problem.getTitle(), code);
    }

    /**
     * 코드 최적화 프롬프트 생성
     */
    private String createOptimizationPrompt(String code, String language, Problem problem) {
        return """
            다음 코드를 최적화해주세요:
            
            언어: %s
            문제: %s
            
            원본 코드:
            %s
            
            다음 관점에서 최적화 제안해주세요:
            1. 시간 복잡도 개선
            2. 공간 복잡도 개선
            3. 가독성 개선
            4. 성능 최적화
            
            JSON 형식으로 응답해주세요:
            {
                "optimizedCode": "최적화된 코드",
                "improvements": ["개선사항1", "개선사항2"],
                "explanation": "최적화 설명"
            }
            """.formatted(language, problem.getTitle(), code);
    }

    /**
     * 코드 설명 프롬프트 생성
     */
    private String createExplanationPrompt(String code, String language) {
        return """
            다음 코드를 설명해주세요:
            
            언어: %s
            코드:
            %s
            
            다음을 포함해서 설명해주세요:
            1. 코드의 목적
            2. 주요 로직 설명
            3. 사용된 알고리즘/자료구조
            4. 시간/공간 복잡도
            5. 개선 가능한 부분
            """.formatted(language, code);
    }

    /**
     * 학습 경로 프롬프트 생성
     */
    private String createLearningPathPrompt(Long userId, List<ProblemSubmission> submissions) {
        StringBuilder submissionHistory = new StringBuilder();
        for (ProblemSubmission submission : submissions) {
            submissionHistory.append("- ").append(submission.getProblem().getTitle())
                           .append(" (").append(submission.getStatus().getDisplayName()).append(")\n");
        }

        return """
            사용자 ID: %d의 학습 경로를 제안해주세요.
            
            제출 이력:
            %s
            
            다음을 고려해서 제안해주세요:
            1. 현재 수준 분석
            2. 약점 파악
            3. 추천 학습 순서
            4. 연습할 문제 유형
            5. 목표 설정
            
            JSON 형식으로 응답해주세요:
            {
                "currentLevel": "중급",
                "weaknesses": ["약점1", "약점2"],
                "recommendedTopics": ["추천주제1", "추천주제2"],
                "learningPath": ["단계1", "단계2", "단계3"],
                "goals": ["목표1", "목표2"]
            }
            """.formatted(userId, submissionHistory.toString());
    }

    /**
     * AI API 호출 (AIProblemGenerationService와 동일한 방식)
     */
    private String callAI(String prompt) {
        // AI API 호출 로직 (AIProblemGenerationService 참조)
        return null;
    }

    /**
     * 응답 파싱 메서드들
     */
    private CodeQualityReport parseCodeQualityResponse(String response) {
        // JSON 파싱 로직
        return CodeQualityReport.builder()
            .score(8.5)
            .feedback("AI 평가 결과")
            .build();
    }

    private CodeOptimizationSuggestion parseOptimizationResponse(String response) {
        // JSON 파싱 로직
        return CodeOptimizationSuggestion.builder()
            .suggestions(List.of("최적화 제안"))
            .build();
    }

    private LearningPathSuggestion parseLearningPathResponse(String response) {
        // JSON 파싱 로직
        return LearningPathSuggestion.builder()
            .suggestions(List.of("학습 경로 제안"))
            .build();
    }

    // 내부 클래스들
    @lombok.Builder
    public static class CodeQualityReport {
        private double score;
        private String feedback;
        private List<String> improvements;
    }

    @lombok.Builder
    public static class CodeOptimizationSuggestion {
        private String optimizedCode;
        private List<String> suggestions;
        private String explanation;
    }

    @lombok.Builder
    public static class LearningPathSuggestion {
        private String currentLevel;
        private List<String> weaknesses;
        private List<String> recommendedTopics;
        private List<String> learningPath;
        private List<String> goals;
        private List<String> suggestions;
    }
} 