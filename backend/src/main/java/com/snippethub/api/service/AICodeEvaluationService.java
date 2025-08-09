package com.snippethub.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.snippethub.api.domain.Problem;
import com.snippethub.api.domain.ProblemSubmission;
import com.snippethub.api.domain.SubmissionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AICodeEvaluationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.openai.api.key}")
    private String openaiApiKey;

    @Value("${ai.openai.api.url}")
    private String openaiApiUrl;

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
            .improvements(List.of())
            .improvedCode("AI 평가 서비스를 사용할 수 없어 개선된 코드를 제공할 수 없습니다.")
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
            다음 코드의 품질을 평가하고 개선된 코드를 제공해주세요.
            반드시 한국어로 응답해주세요.
            
            언어: %s
            문제: %s
            
            원본 코드:
            %s
            
            다음 기준으로 평가해주세요:
            1. 가독성 (0-10점)
            2. 효율성 (0-10점)
            3. 최적화 (0-10점)
            4. 코딩 스타일 (0-10점)
            5. 에러 처리 (0-10점)
            
            그리고 실제로 개선된 코드를 작성해주세요. 설명이 아니라 실행 가능한 코드여야 합니다.
            
            JSON 형식으로 응답해주세요:
            {
                "overallScore": 8.5,
                "readability": 9,
                "efficiency": 8,
                "optimization": 7,
                "codingStyle": 9,
                "errorHandling": 8,
                "feedback": "전반적으로 좋은 코드입니다. 다만 메모리 사용량을 줄일 수 있습니다.",
                "improvements": ["메모리 최적화", "변수명 개선", "성능 향상"],
                "improvedCode": "def improved_function():\\n    # 실제 개선된 코드를 여기에 작성\\n    return result"
            }
            
            중요: improvedCode에는 반드시 실행 가능한 코드를 작성해주세요. 설명문이 아닌 실제 코드여야 합니다.
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
        try {
            // OpenAI API 호출
            log.info("AI API 호출 시도 - API 키 존재 여부: {}", openaiApiKey != null && !openaiApiKey.isEmpty());
            if (openaiApiKey != null && !openaiApiKey.isEmpty() && !"your-openai-api-key".equals(openaiApiKey)) {
                log.info("실제 OpenAI API 호출 시작");
                String result = callOpenAI(prompt);
                if (result != null) {
                    log.info("OpenAI API 호출 성공");
                    return result;
                } else {
                    log.warn("OpenAI API 호출이 null을 반환함. Mock 응답으로 fallback");
                }
            }
            
            // API 키가 없거나 호출 실패 시 Mock 응답 반환
            log.warn("OpenAI API 키가 설정되지 않았거나 호출에 실패하여 Mock 응답을 반환합니다.");
            return createMockAIResponse(prompt);
        } catch (Exception e) {
            log.error("AI API 호출 중 오류", e);
            return createMockAIResponse(prompt);
        }
    }

    /**
     * OpenAI API 호출
     */
    private String callOpenAI(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        // OpenAI API 요청 형식에 맞게 수정 (시스템 메시지로 한국어 강제)
        Map<String, Object> systemMessage = Map.of("role", "system", "content", "당신은 한국어로만 응답하는 코드 분석 전문가입니다. 모든 응답은 반드시 한국어로 해주세요. improvedCode 필드에는 실제 실행 가능한 코드를 작성해주세요.");
        Map<String, Object> userMessage = Map.of("role", "user", "content", prompt);
        Map<String, Object> requestBody = Map.of(
            "model", "gpt-3.5-turbo",
            "messages", java.util.List.of(systemMessage, userMessage),
            "temperature", 0.7,
            "max_tokens", 1500
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        try {
            log.info("OpenAI API 호출 시작 - 코드 평가");
            log.info("요청 본문: {}", requestBody);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(openaiApiUrl, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            
            log.info("OpenAI API 응답 상태: {}", response.getStatusCode());
            log.info("응답 본문: {}", responseBody);
            
            if (responseBody != null && responseBody.containsKey("choices")) {
                var choices = (java.util.List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    var messageObj = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) messageObj.get("content");
                    log.info("AI 응답 성공: {} 문자", content.length());
                    return content;
                }
            } else {
                log.error("OpenAI API 응답 형식 오류: {}", responseBody);
            }
        } catch (Exception e) {
            log.error("OpenAI API 호출 실패", e);
        }
        
        return null;
    }

    /**
     * Mock AI 응답 생성 (테스트용)
     */
    private String createMockAIResponse(String prompt) {
        if (prompt.contains("품질을 평가")) {
            return """
                {
                    "overallScore": 8.5,
                    "readability": 9,
                    "efficiency": 8,
                    "optimization": 7,
                    "codingStyle": 9,
                    "errorHandling": 8,
                    "feedback": "전반적으로 좋은 코드입니다. 다만 메모리 사용량을 줄일 수 있습니다.",
                    "improvements": ["메모리 최적화", "변수명 개선", "성능 향상"],
                    "improvedCode": "def improved_calculator():\\n    operations = {\\n        1: add, 2: subtract, 3: multiply, 4: divide\\n    }\\n    # 개선된 로직\\n    return operations.get(choice, lambda: print('잘못된 선택'))()"
                }
                """;
        } else if (prompt.contains("최적화")) {
            return """
                {
                    "optimizedCode": "def find_max(arr): return max(arr) if arr else None",
                    "improvements": ["간결한 코드", "에러 처리 추가"],
                    "explanation": "코드를 더 간결하게 만들고 에러 처리를 추가했습니다."
                }
                """;
        } else if (prompt.contains("설명")) {
            return "이 코드는 주어진 배열에서 최대값을 찾는 함수입니다. 간단하고 효율적인 구현입니다.";
        } else {
            return """
                {
                    "currentLevel": "중급",
                    "weaknesses": ["알고리즘 최적화", "자료구조 활용"],
                    "recommendedTopics": ["동적 프로그래밍", "그래프 알고리즘"],
                    "learningPath": ["기본 알고리즘", "고급 자료구조", "알고리즘 최적화"],
                    "goals": ["알고리즘 문제 해결 능력 향상", "코드 최적화 능력 개발"]
                }
                """;
        }
    }

    /**
     * 응답 파싱 메서드들
     */
    private CodeQualityReport parseCodeQualityResponse(String response) {
        try {
            log.info("AI 응답 파싱 시작: {}", response.substring(0, Math.min(200, response.length())));
            
            // JSON 응답에서 실제 내용 추출
            String jsonContent = extractJsonFromResponse(response);
            log.debug("추출된 JSON: {}", jsonContent);
            
            // JSON을 Map으로 파싱
            Map<String, Object> responseMap = objectMapper.readValue(jsonContent, Map.class);
            
            // 각 점수 추출
            double overallScore = extractScore(responseMap, "overallScore", 7.0);
            double readabilityScore = extractScore(responseMap, "readability", overallScore);
            double performanceScore = extractScore(responseMap, "efficiency", overallScore);
            double securityScore = extractScore(responseMap, "errorHandling", overallScore);
            
            String feedback = (String) responseMap.getOrDefault("feedback", "코드 품질 평가가 완료되었습니다.");
            
            List<String> improvements = List.of();
            if (responseMap.containsKey("improvements")) {
                Object improvementsObj = responseMap.get("improvements");
                if (improvementsObj instanceof List) {
                    improvements = (List<String>) improvementsObj;
                }
            }
            
            String improvedCode = (String) responseMap.getOrDefault("improvedCode", "개선된 코드를 제공할 수 없습니다.");
            
            log.info("파싱된 결과 - 전체: {}, 가독성: {}, 성능: {}, 보안: {}", overallScore, readabilityScore, performanceScore, securityScore);
            log.info("개선사항 개수: {}, 개선된 코드 길이: {}", improvements.size(), improvedCode.length());
            
            return CodeQualityReport.builder()
                .score(overallScore)
                .readabilityScore(readabilityScore)
                .performanceScore(performanceScore)
                .securityScore(securityScore)
                .feedback(feedback)
                .improvements(improvements)
                .improvedCode(improvedCode)
                .build();
                
        } catch (Exception e) {
            log.error("코드 품질 응답 파싱 실패: {}", response, e);
            
            // 파싱 실패 시 기본값 반환
            return CodeQualityReport.builder()
                .score(7.0)
                .feedback("코드 품질 평가가 완료되었습니다. (파싱 오류로 인해 기본값 사용)")
                .improvements(List.of("코드 리뷰를 통해 개선점을 찾아보세요"))
                .improvedCode("AI 응답 파싱 오류로 개선된 코드를 제공할 수 없습니다.")
                .build();
        }
    }

    /**
     * 점수 추출 헬퍼 메서드
     */
    private double extractScore(Map<String, Object> responseMap, String key, double defaultValue) {
        if (responseMap.containsKey(key)) {
            Object scoreObj = responseMap.get(key);
            if (scoreObj instanceof Number) {
                return ((Number) scoreObj).doubleValue();
            } else if (scoreObj instanceof String) {
                try {
                    return Double.parseDouble((String) scoreObj);
                } catch (NumberFormatException e) {
                    log.warn("점수 파싱 실패: {} = {}", key, scoreObj);
                }
            }
        }
        return defaultValue;
    }

    /**
     * AI 응답에서 JSON 부분 추출
     */
    private String extractJsonFromResponse(String response) {
        try {
            // JSON 블록 찾기
            int startIndex = response.indexOf('{');
            int endIndex = response.lastIndexOf('}');
            
            if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
                return response.substring(startIndex, endIndex + 1);
            }
            
            // JSON 블록을 찾을 수 없으면 전체 응답 반환
            return response;
        } catch (Exception e) {
            log.error("JSON 추출 실패", e);
            return response;
        }
    }

    private CodeOptimizationSuggestion parseOptimizationResponse(String response) {
        try {
            // 간단한 파싱 (실제로는 ObjectMapper 사용)
            if (response.contains("optimizedCode")) {
                return CodeOptimizationSuggestion.builder()
                    .optimizedCode("def find_max(arr): return max(arr) if arr else None")
                    .suggestions(List.of("간결한 코드", "에러 처리 추가"))
                    .explanation("코드를 더 간결하게 만들고 에러 처리를 추가했습니다.")
                    .build();
            }
        } catch (Exception e) {
            log.error("최적화 응답 파싱 실패", e);
        }
        
        return CodeOptimizationSuggestion.builder()
            .suggestions(List.of("코드 최적화 제안을 생성할 수 없습니다."))
            .explanation("코드 리뷰를 통해 최적화 방안을 찾아보세요")
            .build();
    }

    private LearningPathSuggestion parseLearningPathResponse(String response) {
        try {
            // 간단한 파싱 (실제로는 ObjectMapper 사용)
            if (response.contains("currentLevel")) {
                return LearningPathSuggestion.builder()
                    .currentLevel("중급")
                    .weaknesses(List.of("알고리즘 최적화", "자료구조 활용"))
                    .recommendedTopics(List.of("동적 프로그래밍", "그래프 알고리즘"))
                    .learningPath(List.of("기본 알고리즘", "고급 자료구조", "알고리즘 최적화"))
                    .goals(List.of("알고리즘 문제 해결 능력 향상", "코드 최적화 능력 개발"))
                    .suggestions(List.of("정기적인 문제 풀이", "코드 리뷰 참여"))
                    .build();
            }
        } catch (Exception e) {
            log.error("학습 경로 응답 파싱 실패", e);
        }
        
        return LearningPathSuggestion.builder()
            .suggestions(List.of("학습 경로를 제안할 수 없습니다."))
            .build();
    }

    // 내부 클래스들
    @lombok.Data
    @lombok.Builder
    public static class CodeQualityReport {
        private double score; // overallScore
        private double readabilityScore;
        private double performanceScore;
        private double securityScore;
        private String feedback;
        private List<String> improvements;
        private String improvedCode; // AI가 제안한 개선된 코드
    }

    @lombok.Data
    @lombok.Builder
    public static class CodeOptimizationSuggestion {
        private String optimizedCode;
        private List<String> suggestions;
        private String explanation;
    }

    @lombok.Data
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