package com.snippethub.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AICodeEvaluationRequest {
    private Long snippetId;
    private String code;
    private String language;
} 