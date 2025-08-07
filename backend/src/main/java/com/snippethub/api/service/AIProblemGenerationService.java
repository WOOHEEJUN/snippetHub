package com.snippethub.api.service;

import com.snippethub.api.domain.Problem;
import com.snippethub.api.domain.ProblemCategory;
import com.snippethub.api.domain.ProblemDifficulty;
import com.snippethub.api.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class AIProblemGenerationService {
    
    private static final Logger log = LoggerFactory.getLogger(AIProblemGenerationService.class);

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
     * AI를 사용하여 새로운 문제 생성 (사용자 설명 포함)
     */
    public Optional<Problem> generateProblem(ProblemDifficulty difficulty, ProblemCategory category, String userDescription, String additionalRequirements) {
        return generateProblemWithUserInput(difficulty, category, userDescription, additionalRequirements);
    }

    /**
     * AI를 사용하여 새로운 문제 생성 (기본 버전)
     */
    public Optional<Problem> generateProblem(ProblemDifficulty difficulty, ProblemCategory category) {
        return generateProblemWithUserInput(difficulty, category, null, null);
    }

    /**
     * AI를 사용하여 새로운 문제 생성 (내부 구현)
     */
    private Optional<Problem> generateProblemWithUserInput(ProblemDifficulty difficulty, ProblemCategory category, String userDescription, String additionalRequirements) {
        try {
            log.info("AI 문제 생성 시작 - 난이도: {}, 카테고리: {}", difficulty, category);
            if (userDescription != null && !userDescription.trim().isEmpty()) {
                log.info("사용자 설명: {}", userDescription);
            }
            if (additionalRequirements != null && !additionalRequirements.trim().isEmpty()) {
                log.info("추가 요구사항: {}", additionalRequirements);
            }

            if (openaiApiKey == null || openaiApiKey.isEmpty() || "your-openai-api-key".equals(openaiApiKey)) {
                log.error("OpenAI API 키가 유효하지 않습니다.");
                return Optional.empty(); // API 키가 없으면 실패 처리
            }

            log.info("OpenAI API를 사용하여 문제 생성을 시도합니다.");
            String prompt = createProblemPrompt(difficulty, category, userDescription, additionalRequirements);
            log.debug("생성된 프롬프트: {}", prompt);

            String aiResponse = callAI(prompt);

            if (aiResponse == null || aiResponse.trim().isEmpty()) {
                log.error("AI API로부터 응답을 받지 못했습니다.");
                return Optional.empty(); // AI 응답이 없으면 실패 처리
            }

            log.info("AI로부터 응답을 받았습니다. 파싱을 시작합니다.");
            log.debug("AI Raw Response: {}", aiResponse.substring(0, Math.min(500, aiResponse.length())));

            Problem problem = parseAIResponse(aiResponse, difficulty, category);
            if (problem == null) {
                log.error("AI 응답 파싱에 실패했습니다.");
                return Optional.empty(); // 파싱 실패 시 실패 처리
            }

            log.info("AI 응답 파싱 성공: {}", problem.getTitle());
            if (isDuplicateProblem(problem)) {
                log.warn("중복된 문제가 생성되었습니다: {}", problem.getTitle());
                // 중복 시에도 실패 처리 또는 다른 정책 적용 가능
                return Optional.empty(); 
            }

            Problem savedProblem = problemRepository.save(problem);
            log.info("AI가 새로운 문제를 생성하고 데이터베이스에 저장했습니다: {}", savedProblem.getTitle());
            return Optional.of(savedProblem);

        } catch (Exception e) {
            log.error("AI 문제 생성 과정에서 예기치 않은 오류가 발생했습니다.", e);
            return Optional.empty(); // 그 외 모든 예외 발생 시 실패 처리
        }
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

        // OpenAI API 요청 형식에 맞게 수정
        Map<String, Object> message = Map.of("role", "user", "content", prompt);
        Map<String, Object> requestBody = Map.of(
            "model", "gpt-4",
            "messages", java.util.List.of(message),
            "temperature", 0.7,
            "max_tokens", 2000
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        try {
            log.info("OpenAI API 호출 시작 - URL: {}", openaiApiUrl);
            log.debug("요청 본문: {}", requestBody);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(openaiApiUrl, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            
            log.info("OpenAI API 응답 상태: {}", response.getStatusCode());
            log.debug("응답 본문: {}", responseBody);
            
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
            log.debug("추출된 JSON: {}", jsonContent);
            
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
                .timeLimit(1000)
                .memoryLimit(128)
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
     * Mock 문제 생성 (AI API 실패 시 사용) - 기본 버전
     */
    private Optional<Problem> createMockProblem(ProblemDifficulty difficulty, ProblemCategory category) {
        return createMockProblem(difficulty, category, null, null);
    }

    /**
     * Mock 문제 생성 (AI API 실패 시 사용) - 사용자 설명 포함
     */
    private Optional<Problem> createMockProblem(ProblemDifficulty difficulty, ProblemCategory category, String userDescription, String additionalRequirements) {
        try {
            String title, description, problemStatement, inputFormat, outputFormat, constraints, sampleInput, sampleOutput, solutionTemplate;
            
            // 사용자 설명이 있는 경우, 그 내용을 바탕으로 문제 생성
            if (userDescription != null && !userDescription.trim().isEmpty()) {
                String userDesc = userDescription.trim();
                
                // 현수라는 이름이 포함된 경우
                if (userDesc.contains("현수") || userDesc.contains("등장인물")) {
                    title = "현수의 알고리즘 도전";
                    description = "현수가 알고리즘 문제를 해결하는 과정을 시뮬레이션하는 문제입니다.";
                    problemStatement = String.format("현수는 %s 문제를 풀고 있습니다. %s\n\n현수가 주어진 조건을 만족하는 프로그램을 작성할 수 있도록 도와주세요.", 
                        category == ProblemCategory.ALGORITHM ? "알고리즘" : 
                        category == ProblemCategory.DATA_STRUCTURE ? "자료구조" : "수학", userDesc);
                    inputFormat = "첫 번째 줄에 문제의 크기 N이 주어집니다.\n두 번째 줄부터 N개의 데이터가 주어집니다.";
                    outputFormat = "현수가 요구하는 결과를 출력하세요.";
                    constraints = "1 ≤ N ≤ 1000\n모든 입력값은 정수입니다.";
                    sampleInput = "3\n1 2 3";
                    sampleOutput = "6";
                    solutionTemplate = "// 현수의 문제 해결 코드\npublic class Solution {\n    public static void main(String[] args) {\n        // 구현하세요\n    }\n}";
                }
                // 배열 관련 문제
                else if (userDesc.contains("배열") || userDesc.contains("리스트")) {
                    title = "배열 처리 문제";
                    description = userDesc;
                    problemStatement = String.format("%s\n\n주어진 배열을 처리하여 요구사항을 만족하는 결과를 구하세요.", userDesc);
                    inputFormat = "첫 번째 줄에 배열의 크기 N이 주어집니다.\n두 번째 줄에 N개의 정수가 공백으로 구분되어 주어집니다.";
                    outputFormat = "요구사항에 맞는 결과를 출력하세요.";
                    constraints = "1 ≤ N ≤ 1000\n-10000 ≤ 배열의 각 원소 ≤ 10000";
                    sampleInput = "5\n3 7 2 9 1";
                    sampleOutput = "결과값";
                    solutionTemplate = "// 배열 처리 솔루션\npublic class Solution {\n    public static void main(String[] args) {\n        // 구현하세요\n    }\n}";
                }
                // 문자열 관련 문제
                else if (userDesc.contains("문자열") || userDesc.contains("문자")) {
                    title = "문자열 처리 문제";
                    description = userDesc;
                    problemStatement = String.format("%s\n\n주어진 문자열을 처리하여 요구사항을 만족하는 결과를 구하세요.", userDesc);
                    inputFormat = "첫 번째 줄에 문자열이 주어집니다.";
                    outputFormat = "요구사항에 맞는 결과를 출력하세요.";
                    constraints = "문자열의 길이는 1 이상 1000 이하입니다.";
                    sampleInput = "hello world";
                    sampleOutput = "결과값";
                    solutionTemplate = "// 문자열 처리 솔루션\npublic class Solution {\n    public static void main(String[] args) {\n        // 구현하세요\n    }\n}";
                }
                // 수학 관련 문제
                else if (userDesc.contains("수학") || userDesc.contains("계산") || userDesc.contains("합") || userDesc.contains("곱")) {
                    title = "수학 계산 문제";
                    description = userDesc;
                    problemStatement = String.format("%s\n\n주어진 수학적 조건을 만족하는 계산을 수행하세요.", userDesc);
                    inputFormat = "첫 번째 줄에 계산할 숫자의 개수 N이 주어집니다.\n두 번째 줄에 N개의 정수가 공백으로 구분되어 주어집니다.";
                    outputFormat = "계산 결과를 출력하세요.";
                    constraints = "1 ≤ N ≤ 1000\n-10000 ≤ 각 숫자 ≤ 10000";
                    sampleInput = "3\n1 2 3";
                    sampleOutput = "6";
                    solutionTemplate = "// 수학 계산 솔루션\npublic class Solution {\n    public static void main(String[] args) {\n        // 구현하세요\n    }\n}";
                }
                // 일반적인 경우
                else {
                    title = String.format("사용자 요구사항 문제 - %s", difficulty.name());
                    description = userDesc;
                    problemStatement = String.format("%s\n\n위 요구사항을 만족하는 프로그램을 작성하세요.", userDesc);
                    inputFormat = "표준 입력을 사용합니다.";
                    outputFormat = "표준 출력으로 결과를 출력하세요.";
                    constraints = "입력 제한은 문제에 따라 다릅니다.";
                    sampleInput = "입력 예시";
                    sampleOutput = "출력 예시";
                    solutionTemplate = "// 솔루션 구현\npublic class Solution {\n    public static void main(String[] args) {\n        // 구현하세요\n    }\n}";
                }
            } else {
                // 기본 문제들
                title = String.format("%s - %s Problem", category.name(), difficulty.name());
                description = String.format("This is a %s difficulty problem in %s category.", 
                    difficulty.name().toLowerCase(), category.name().toLowerCase());
                problemStatement = "주어진 조건에 맞는 솔루션을 구현하세요.";
                inputFormat = "표준 입력";
                outputFormat = "표준 출력";
                constraints = "1 ≤ N ≤ 100";
                sampleInput = "5";
                sampleOutput = "25";
                solutionTemplate = "// 여기에 솔루션을 작성하세요\npublic class Solution {\n    public static void main(String[] args) {\n        // 구현하세요\n    }\n}";
            }
            
            // 추가 요구사항이 있으면 문제 문장에 반영
            if (additionalRequirements != null && !additionalRequirements.trim().isEmpty()) {
                problemStatement = problemStatement + "\n\n추가 요구사항: " + additionalRequirements.trim();
            }
            
            Problem mockProblem = Problem.builder()
                .title(title)
                .description(description)
                .problemStatement(problemStatement)
                .inputFormat(inputFormat)
                .outputFormat(outputFormat)
                .constraints(constraints)
                .sampleInput(sampleInput)
                .sampleOutput(sampleOutput)
                .solutionTemplate(solutionTemplate)
                .difficulty(difficulty)
                .category(category)
                .timeLimit(1000)
                .memoryLimit(128)
                .build();
            
            Problem savedProblem = problemRepository.save(mockProblem);
            log.info("Mock 문제가 생성되었습니다: {} (사용자 설명: {})", savedProblem.getTitle(), userDescription);
            return Optional.of(savedProblem);
        } catch (Exception e) {
            log.error("Mock 문제 생성 실패", e);
            return Optional.empty();
        }
    }

    /**
     * AI API 연결 테스트
     */
    public String testAIConnection() {
        try {
            System.out.println("=== AI API 연결 테스트 시작 ===");
            System.out.println("API 키 길이: " + (openaiApiKey != null ? openaiApiKey.length() : "null"));
            System.out.println("API URL: " + openaiApiUrl);
            
            String testPrompt = "Say 'Hello World' in JSON format: {\"message\": \"Hello World\"}";
            String response = callOpenAI(testPrompt);
            
            System.out.println("AI 응답: " + response);
            System.out.println("=== AI API 연결 테스트 완료 ===");
            
            return response != null ? response : "No response from AI";
        } catch (Exception e) {
            System.out.println("AI API 테스트 실패: " + e.getMessage());
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }

    /**
     * 문제 생성 프롬프트 생성 - 기본 버전
     */
    private String createProblemPrompt(ProblemDifficulty difficulty, ProblemCategory category) {
        return createProblemPrompt(difficulty, category, null, null);
    }

    /**
     * 문제 생성 프롬프트 생성 - 사용자 설명 포함
     */
    private String createProblemPrompt(ProblemDifficulty difficulty, ProblemCategory category, String userDescription, String additionalRequirements) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("당신은 프로그래밍 문제를 생성하는 전문가입니다. 다음 조건에 맞는 창의적이고 교육적인 프로그래밍 문제를 JSON 형식으로 생성해주세요:\n\n");
        prompt.append("난이도: ").append(difficulty.getDisplayName()).append("\n");
        prompt.append("카테고리: ").append(category.getDisplayName()).append("\n");
        
        if (userDescription != null && !userDescription.trim().isEmpty()) {
            prompt.append("사용자 요구사항: ").append(userDescription).append("\n");
            prompt.append("중요: 사용자의 요구사항을 정확히 반영하여 문제를 생성하세요. 예를 들어 '현수라는 등장인물'을 요청했다면, 현수가 주인공인 스토리텔링 문제를 만들어주세요.\n");
        }
        
        if (additionalRequirements != null && !additionalRequirements.trim().isEmpty()) {
            prompt.append("추가 요구사항: ").append(additionalRequirements).append("\n");
        }
        
        prompt.append("""
            
            문제 생성 가이드라인:
            1. 사용자의 요구사항을 정확히 반영하세요.
            2. 창의적이고 흥미로운 스토리나 시나리오를 포함하세요.
            3. 난이도에 맞는 적절한 복잡도를 유지하세요.
            4. 명확하고 이해하기 쉬운 문제 설명을 작성하세요.
            5. 실제 프로그래밍에 도움이 되는 문제를 만드세요.
            
            매우 중요: 생성되는 JSON은 반드시 유효해야 합니다. 모든 키는 고유해야 하며, 중복 키가 절대 없어야 합니다. 응답을 보내기 전에 JSON 형식을 다시 한번 확인해주세요.

            응답 형식:
            {
              "title": "문제 제목 (사용자 요구사항 반영)",
              "description": "문제에 대한 간단한 설명",
              "problemStatement": "상세한 문제 설명 (스토리나 시나리오 포함)",
              "inputFormat": "입력 형식 설명",
              "outputFormat": "출력 형식 설명", 
              "constraints": "제약 조건",
              "sampleInput": "샘플 입력",
              "sampleOutput": "샘플 출력",
              "solutionTemplate": "기본 코드 템플릿"
            }
            """);
        
        return prompt.toString();
    }
} 