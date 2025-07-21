package com.snippethub.api.service;

import com.snippethub.api.domain.CodeExecution;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.User;
import com.snippethub.api.dto.ExecutionRequest;
import com.snippethub.api.dto.ExecutionResponse;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.repository.CodeExecutionRepository;
import com.snippethub.api.repository.SnippetRepository;
import com.snippethub.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExecutionServiceTest {

    @InjectMocks
    private ExecutionService executionService;

    @Mock
    private CodeExecutionRepository codeExecutionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SnippetRepository snippetRepository;

    private User testUser;
    private Snippet testSnippet;
    private ExecutionRequest javaRequest;
    private ExecutionRequest pythonRequest;
    private ExecutionRequest cRequest;
    private ExecutionRequest htmlRequest;
    private ExecutionRequest cssRequest;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@example.com")
                .password("password")
                .nickname("testuser")
                .build();

        testSnippet = Snippet.builder()
                .author(testUser)
                .title("Test Snippet")
                .description("Description")
                .language("JAVA")
                .code("Code")
                .isPublic(true)
                .build();

        javaRequest = new ExecutionRequest();
        javaRequest.setLanguage("JAVA");
        javaRequest.setCode("public class Main { public static void main(String[] args) { System.out.println(\"Hello\"); } }");
        javaRequest.setInput("");

        pythonRequest = new ExecutionRequest();
        pythonRequest.setLanguage("PYTHON");
        pythonRequest.setCode("print('Hello')");
        pythonRequest.setInput("");

        cRequest = new ExecutionRequest();
        cRequest.setLanguage("C");
        cRequest.setCode("#include <stdio.h>\nint main() { printf(\"Hello\"); return 0; }");
        cRequest.setInput("");

        htmlRequest = new ExecutionRequest();
        htmlRequest.setLanguage("HTML");
        htmlRequest.setCode("<h1>Hello</h1>");

        cssRequest = new ExecutionRequest();
        cssRequest.setLanguage("CSS");
        cssRequest.setCode("body { color: red; }");
    }

    @Test
    @DisplayName("Java 코드 실행 성공")
    void executeJavaSuccess() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(codeExecutionRepository.save(any(CodeExecution.class))).thenReturn(any(CodeExecution.class));

        ExecutionResponse response = executionService.execute(javaRequest, 1L);

        assertThat(response.getStatus()).isEqualTo(CodeExecution.Status.SUCCESS.name());
        assertThat(response.getOutput()).contains("Hello");
        verify(codeExecutionRepository, times(1)).save(any(CodeExecution.class));
    }

    @Test
    @DisplayName("Python 코드 실행 성공")
    void executePythonSuccess() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(codeExecutionRepository.save(any(CodeExecution.class))).thenReturn(any(CodeExecution.class));

        ExecutionResponse response = executionService.execute(pythonRequest, 1L);

        assertThat(response.getStatus()).isEqualTo(CodeExecution.Status.SUCCESS.name());
        assertThat(response.getOutput()).contains("Hello");
        verify(codeExecutionRepository, times(1)).save(any(CodeExecution.class));
    }

    @Test
    @DisplayName("C 코드 실행 성공")
    void executeCSuccess() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(codeExecutionRepository.save(any(CodeExecution.class))).thenReturn(any(CodeExecution.class));

        ExecutionResponse response = executionService.execute(cRequest, 1L);

        assertThat(response.getStatus()).isEqualTo(CodeExecution.Status.SUCCESS.name());
        assertThat(response.getOutput()).contains("Hello");
        verify(codeExecutionRepository, times(1)).save(any(CodeExecution.class));
    }

    @Test
    @DisplayName("HTML 코드 실행 성공")
    void executeHtmlSuccess() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(codeExecutionRepository.save(any(CodeExecution.class))).thenReturn(any(CodeExecution.class));

        ExecutionResponse response = executionService.execute(htmlRequest, 1L);

        assertThat(response.getStatus()).isEqualTo(CodeExecution.Status.SUCCESS.name());
        assertThat(response.getOutput()).isEqualTo(htmlRequest.getCode());
        verify(codeExecutionRepository, times(1)).save(any(CodeExecution.class));
    }

    @Test
    @DisplayName("CSS 코드 실행 성공")
    void executeCssSuccess() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(codeExecutionRepository.save(any(CodeExecution.class))).thenReturn(any(CodeExecution.class));

        ExecutionResponse response = executionService.execute(cssRequest, 1L);

        assertThat(response.getStatus()).isEqualTo(CodeExecution.Status.SUCCESS.name());
        assertThat(response.getOutput()).isEqualTo(cssRequest.getCode());
        verify(codeExecutionRepository, times(1)).save(any(CodeExecution.class));
    }

    @Test
    @DisplayName("지원하지 않는 언어")
    void executeUnsupportedLanguage() {
        ExecutionRequest unsupportedRequest = new ExecutionRequest();
        unsupportedRequest.setLanguage("RUBY");
        unsupportedRequest.setCode("puts 'Hello'");

        when(userRepository.findById(anyLong())).thenReturn(Optional.of(testUser));
        when(codeExecutionRepository.save(any(CodeExecution.class))).thenReturn(any(CodeExecution.class));

        ExecutionResponse response = executionService.execute(unsupportedRequest, 1L);

        assertThat(response.getStatus()).isEqualTo(CodeExecution.Status.ERROR.name());
        assertThat(response.getError()).contains("Unsupported language");
        verify(codeExecutionRepository, times(1)).save(any(CodeExecution.class));
    }
}