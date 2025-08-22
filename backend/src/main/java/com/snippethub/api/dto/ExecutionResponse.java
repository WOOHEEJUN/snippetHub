package com.snippethub.api.dto;

import com.snippethub.api.domain.CodeExecution;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Builder
public class ExecutionResponse {
    private Long executionId;
    private String language;
    private String code;
    private String input;
    private String output;
    private String error;
    private Integer executionTime;
    private Integer memoryUsed;
    private String status;
    private LocalDateTime executedAt;

    // Getter 메서드들
    public Long getExecutionId() { return executionId; }
    public String getLanguage() { return language; }
    public String getCode() { return code; }
    public String getInput() { return input; }
    public String getOutput() { return output != null ? output : ""; }
    public String getError() { return error != null ? error : ""; }
    public Integer getExecutionTime() { return executionTime; }
    public Integer getMemoryUsed() { return memoryUsed; }
    public String getStatus() { return status; }
    public LocalDateTime getExecutedAt() { return executedAt; }

    public static ExecutionResponse from(CodeExecution codeExecution) {
        return ExecutionResponse.builder()
                .executionId(codeExecution.getId())
                .language(codeExecution.getLanguage())
                .code(codeExecution.getCode())
                .input(codeExecution.getInput())
                .output(codeExecution.getOutput())
                .error(codeExecution.getError())
                .executionTime(codeExecution.getExecutionTime())
                .memoryUsed(codeExecution.getMemoryUsed())
                .status(codeExecution.getStatus().name())
                .executedAt(codeExecution.getExecutedAt())
                .build();
    }
}
