package com.snippethub.api.service;

import com.snippethub.api.domain.Problem;
import com.snippethub.api.domain.ProblemCategory;
import com.snippethub.api.domain.ProblemDifficulty;
import com.snippethub.api.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.snippethub.api.dto.ai.AIProblemResponse;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIProblemGenerationService {

    private final ProblemRepository problemRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.openai.api.key}")
    private String openaiApiKey;

    @Value("${ai.openai.api.url}")
    private String openaiApiUrl;

    @Value("${ai.claude.api.key}")
    private String claudeApiKey;

    @Value("${ai.claude.api.url}")
    private String claudeApiUrl;

    /**
     * AI를 사용하여 새로운 문제 생성
     */
    public Optional<Problem> generateProblem(ProblemDifficulty difficulty, ProblemCategory category) {
        try {
            String prompt = createProblemPrompt(difficulty, category);
            String aiResponse = callAI(prompt);
            
            if (aiResponse != null) {
                Problem problem = parseAIResponse(aiResponse, difficulty, category);
                if (problem != null) {
                    // 중복 검사
                    if (!isDuplicateProblem(problem)) {
                        Problem savedProblem = problemRepository.save(problem);
                        log.info("AI가 새로운 문제를 생성했습니다: {}", savedProblem.getTitle());
                        return Optional.of(savedProblem);
                    } else {
                        log.warn("중복된 문제가 생성되었습니다: {}", problem.getTitle());
                    }
                }
            }
        } catch (Exception e) {
            log.error("AI 문제 생성 중 오류 발생", e);
        }
        
        return Optional.empty();
    }

    /**
     * 일일 과제용 문제 자동 생성
     */
    public Optional<Problem> generateDailyProblem() {
        // 난이도별 가중치 설정 (쉬운 문제가 더 많이 나오도록)
        ProblemDifficulty[] difficulties = {
            ProblemDifficulty.EASY, ProblemDifficulty.EASY, ProblemDifficulty.EASY,
            ProblemDifficulty.MEDIUM, ProblemDifficulty.MEDIUM,
            ProblemDifficulty.HARD
        };
        
        ProblemDifficulty randomDifficulty = difficulties[(int) (Math.random() * difficulties.length)];
        ProblemCategory randomCategory = ProblemCategory.values()[(int) (Math.random() * ProblemCategory.values().length)];
        
        return generateProblem(randomDifficulty, randomCategory);
    }

    /**
     * 사용자 수준에 맞는 개인화된 문제 생성
     */
    public Optional<Problem> generatePersonalizedProblem(Long userId, int userLevel) {
        // 사용자 수준에 따른 난이도 결정
        ProblemDifficulty difficulty = determineDifficultyByUserLevel(userLevel);
        
        // 사용자가 선호하는 카테고리 분석 (이전 제출 이력 기반)
        ProblemCategory preferredCategory = analyzeUserPreference(userId);
        
        return generateProblem(difficulty, preferredCategory);
    }

    /**
     * AI API 호출
     */
    private String callAI(String prompt) {
        try {
            // OpenAI API 호출
            if (openaiApiKey != null && !openaiApiKey.isEmpty()) {
                return callOpenAI(prompt);
            }
            
            // Claude API 호출 (백업)
            if (claudeApiKey != null && !claudeApiKey.isEmpty()) {
                return callClaude(prompt);
            }
            
        } catch (Exception e) {
            log.error("AI API 호출 중 오류", e);
        }
        
        return null;
    }

    /**
     * OpenAI API 호출
     */
    private String callOpenAI(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        Map<String, Object> requestBody = Map.of(
            "model", "gpt-4",
            "messages", Map.of("role", "user", "content", prompt),
            "temperature", 0.7,
            "max_tokens", 2000
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(openaiApiUrl, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody != null && responseBody.containsKey("choices")) {
                var choices = (java.util.List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    var message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("OpenAI API 호출 실패", e);
        }
        
        return null;
    }

    /**
     * Claude API 호출
     */
    private String callClaude(String prompt) {
        // Claude API 구현 (OpenAI와 유사한 구조)
        return null;
    }

    /**
     * AI 응답을 Problem 엔티티로 파싱
     */
    private Problem parseAIResponse(String aiResponse, ProblemDifficulty difficulty, ProblemCategory category) {
        try {
            // JSON 응답에서 실제 내용 추출
            String jsonContent = extractJsonFromResponse(aiResponse);
            
            // JSON을 AIProblemResponse로 파싱
            AIProblemResponse aiResponseObj = objectMapper.readValue(jsonContent, AIProblemResponse.class);
            
            // Problem 엔티티로 변환
            return Problem.builder()
                .title(aiResponseObj.getTitle())
                .description(aiResponseObj.getDescription())
                .problemStatement(aiResponseObj.getProblemStatement())
                .inputFormat(aiResponseObj.getInputFormat())
                .outputFormat(aiResponseObj.getOutputFormat())
                .constraints(aiResponseObj.getConstraints())
                .sampleInput(aiResponseObj.getSampleInput())
                .sampleOutput(aiResponseObj.getSampleOutput())
                .solutionTemplate(aiResponseObj.getSolutionTemplate())
                .difficulty(difficulty)
                .category(category)
                .build();
        } catch (Exception e) {
            log.error("AI 응답 파싱 실패: {}", aiResponse, e);
            return null;
        }
    }

    /**
     * AI 응답에서 JSON 부분 추출
     */
    private String extractJsonFromResponse(String response) {
        // AI가 ```json ... ``` 형태로 응답할 수 있으므로 처리
        if (response.contains("```json")) {
            int start = response.indexOf("```json") + 7;
            int end = response.indexOf("```", start);
            return response.substring(start, end).trim();
        }
        return response.trim();
    }

    /**
     * 문제 중복 검사
     */
    private boolean isDuplicateProblem(Problem problem) {
        return problemRepository.findByTitleContainingIgnoreCaseAndIsActiveTrue(
            problem.getTitle(), null).hasContent();
    }

    /**
     * 사용자 수준에 따른 난이도 결정
     */
    private ProblemDifficulty determineDifficultyByUserLevel(int userLevel) {
        if (userLevel < 3) return ProblemDifficulty.EASY;
        if (userLevel < 7) return ProblemDifficulty.MEDIUM;
        return ProblemDifficulty.HARD;
    }

    /**
     * 사용자 선호 카테고리 분석
     */
    private ProblemCategory analyzeUserPreference(Long userId) {
        // 사용자의 이전 제출 이력을 분석하여 선호 카테고리 결정
        // 실제 구현에서는 ProblemSubmissionRepository 사용
        return ProblemCategory.ALGORITHM; // 기본값
    }

    /**
     * 문제 생성 프롬프트 생성
     */
    private String createProblemPrompt(ProblemDifficulty difficulty, ProblemCategory category) {
        return """
            다음 조건에 맞는 프로그래밍 문제를 생성해주세요:
            
            난이도: %s
            카테고리: %s
            
            요구사항:
            1. 명확하고 이해하기 쉬운 문제 설명
            2. 구체적인 입력/출력 형식
            3. 적절한 제약 조건
            4. 2-3개의 샘플 테스트 케이스
            5. 기본 코드 템플릿 (Java, Python, JavaScript)
            6. 문제 해결을 위한 힌트 2-3개
            
            JSON 형식으로 응답해주세요.
            """.formatted(difficulty.getDisplayName(), category.getDisplayName());
    }
} 