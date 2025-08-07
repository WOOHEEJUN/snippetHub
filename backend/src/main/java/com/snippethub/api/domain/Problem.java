package com.snippethub.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "problems")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "problem_id")
    private Long id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "problem_statement", columnDefinition = "TEXT")
    private String problemStatement;

    @Column(name = "input_format", columnDefinition = "TEXT")
    private String inputFormat;

    @Column(name = "output_format", columnDefinition = "TEXT")
    private String outputFormat;

    @Column(name = "constraints", columnDefinition = "TEXT")
    private String constraints;

    @Column(name = "sample_input", columnDefinition = "TEXT")
    private String sampleInput;

    @Column(name = "sample_output", columnDefinition = "TEXT")
    private String sampleOutput;

    @Column(name = "solution_template", columnDefinition = "TEXT")
    private String solutionTemplate;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false)
    private ProblemDifficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private ProblemCategory category;

    @Column(name = "time_limit")
    private Integer timeLimit = 1000; // milliseconds

    @Column(name = "memory_limit")
    private Integer memoryLimit = 128; // MB

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "total_submissions")
    private Integer totalSubmissions = 0;

    @Column(name = "correct_submissions")
    private Integer correctSubmissions = 0;

    @Column(name = "success_rate")
    private Double successRate = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Problem(String title, String description, String problemStatement, 
                  String inputFormat, String outputFormat, String constraints,
                  String sampleInput, String sampleOutput, String solutionTemplate,
                  ProblemDifficulty difficulty, ProblemCategory category,
                  Integer timeLimit, Integer memoryLimit) {
        this.title = title;
        this.description = description;
        this.problemStatement = problemStatement;
        this.inputFormat = inputFormat;
        this.outputFormat = outputFormat;
        this.constraints = constraints;
        this.sampleInput = sampleInput;
        this.sampleOutput = sampleOutput;
        this.solutionTemplate = solutionTemplate;
        this.difficulty = difficulty;
        this.category = category;
        this.timeLimit = timeLimit != null ? timeLimit : 1000;
        this.memoryLimit = memoryLimit != null ? memoryLimit : 128;
    }

    public void incrementSubmissions(boolean isCorrect) {
        this.totalSubmissions = (this.totalSubmissions == null ? 0 : this.totalSubmissions) + 1;
        if (isCorrect) {
            this.correctSubmissions = (this.correctSubmissions == null ? 0 : this.correctSubmissions) + 1;
        }
        this.successRate = (double) this.correctSubmissions / this.totalSubmissions * 100;
    }

    public void setActive(boolean active) {
        this.isActive = active;
    }
} 