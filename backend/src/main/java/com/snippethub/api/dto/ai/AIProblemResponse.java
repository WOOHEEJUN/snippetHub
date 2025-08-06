package com.snippethub.api.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class AIProblemResponse {
    private String title;
    private String description;
    @JsonProperty("problem_statement")
    private String problemStatement;
    @JsonProperty("input_format")
    private String inputFormat;
    @JsonProperty("output_format")
    private String outputFormat;
    private String constraints;
    @JsonProperty("sample_input")
    private String sampleInput;
    @JsonProperty("sample_output")
    private String sampleOutput;
    @JsonProperty("solution_template")
    private String solutionTemplate;
    @JsonProperty("test_cases")
    private List<TestCase> testCases;
    private List<String> hints;
    private List<String> tags;

    @Data
    public static class TestCase {
        private String input;
        private String output;
        private String explanation;
    }
} 