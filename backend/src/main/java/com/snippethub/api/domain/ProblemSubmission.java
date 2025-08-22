package com.snippethub.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "problem_submissions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProblemSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(name = "submitted_code", nullable = false, columnDefinition = "TEXT")
    private String submittedCode;

    @Column(name = "language", nullable = false)
    private String language;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SubmissionStatus status;

    @Column(name = "execution_time")
    private Long executionTime; // milliseconds

    @Column(name = "memory_used")
    private Long memoryUsed; // KB

    @Column(name = "test_cases_passed")
    private Integer testCasesPassed = 0;

    @Column(name = "total_test_cases")
    private Integer totalTestCases = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "output", columnDefinition = "TEXT")
    private String output;

    @CreationTimestamp
    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;

    @Builder
    public ProblemSubmission(User user, Problem problem, String submittedCode, 
                           String language, SubmissionStatus status) {
        this.user = user;
        this.problem = problem;
        this.submittedCode = submittedCode;
        this.language = language;
        this.status = status;
    }

    public void updateResult(SubmissionStatus status, Long executionTime, Long memoryUsed,
                           Integer testCasesPassed, Integer totalTestCases, 
                           String errorMessage, String output) {
        this.status = status;
        this.executionTime = executionTime;
        this.memoryUsed = memoryUsed;
        this.testCasesPassed = testCasesPassed;
        this.totalTestCases = totalTestCases;
        this.errorMessage = errorMessage;
        this.output = output;
    }

    public boolean isCorrect() {
        return status == SubmissionStatus.ACCEPTED;
    }
} 