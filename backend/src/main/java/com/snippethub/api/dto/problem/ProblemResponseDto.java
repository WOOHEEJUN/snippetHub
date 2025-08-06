package com.snippethub.api.dto.problem;

import com.snippethub.api.domain.Problem;
import com.snippethub.api.domain.ProblemCategory;
import com.snippethub.api.domain.ProblemDifficulty;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ProblemResponseDto {

    private final Long problemId;
    private final String title;
    private final String description;
    private final String problemStatement;
    private final String inputFormat;
    private final String outputFormat;
    private final String constraints;
    private final String sampleInput;
    private final String sampleOutput;
    private final String solutionTemplate;
    private final ProblemDifficulty difficulty;
    private final ProblemCategory category;
    private final Integer timeLimit;
    private final Integer memoryLimit;
    private final Integer totalSubmissions;
    private final Integer correctSubmissions;
    private final Double successRate;
    private final LocalDateTime createdAt;

    public ProblemResponseDto(Problem problem) {
        this.problemId = problem.getId();
        this.title = problem.getTitle();
        this.description = problem.getDescription();
        this.problemStatement = problem.getProblemStatement();
        this.inputFormat = problem.getInputFormat();
        this.outputFormat = problem.getOutputFormat();
        this.constraints = problem.getConstraints();
        this.sampleInput = problem.getSampleInput();
        this.sampleOutput = problem.getSampleOutput();
        this.solutionTemplate = problem.getSolutionTemplate();
        this.difficulty = problem.getDifficulty();
        this.category = problem.getCategory();
        this.timeLimit = problem.getTimeLimit();
        this.memoryLimit = problem.getMemoryLimit();
        this.totalSubmissions = problem.getTotalSubmissions();
        this.correctSubmissions = problem.getCorrectSubmissions();
        this.successRate = problem.getSuccessRate();
        this.createdAt = problem.getCreatedAt();
    }
} 