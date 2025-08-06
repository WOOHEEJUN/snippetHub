package com.snippethub.api.dto.problem;

import com.snippethub.api.domain.ProblemSubmission;
import com.snippethub.api.domain.SubmissionStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ProblemSubmissionResponseDto {

    private final Long submissionId;
    private final Long problemId;
    private final String problemTitle;
    private final String submittedCode;
    private final String language;
    private final SubmissionStatus status;
    private final Long executionTime;
    private final Long memoryUsed;
    private final Integer testCasesPassed;
    private final Integer totalTestCases;
    private final String errorMessage;
    private final String output;
    private final LocalDateTime submittedAt;
    private final boolean isCorrect;

    public ProblemSubmissionResponseDto(ProblemSubmission submission) {
        this.submissionId = submission.getId();
        this.problemId = submission.getProblem().getId();
        this.problemTitle = submission.getProblem().getTitle();
        this.submittedCode = submission.getSubmittedCode();
        this.language = submission.getLanguage();
        this.status = submission.getStatus();
        this.executionTime = submission.getExecutionTime();
        this.memoryUsed = submission.getMemoryUsed();
        this.testCasesPassed = submission.getTestCasesPassed();
        this.totalTestCases = submission.getTotalTestCases();
        this.errorMessage = submission.getErrorMessage();
        this.output = submission.getOutput();
        this.submittedAt = submission.getSubmittedAt();
        this.isCorrect = submission.isCorrect();
    }
} 