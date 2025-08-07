package com.snippethub.api.dto;

import lombok.Data;

@Data
public class AICodeEvaluationRequest {
    private String code;
    private String language;
    private Long problemId;
} 