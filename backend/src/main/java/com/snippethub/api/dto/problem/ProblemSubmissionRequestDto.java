package com.snippethub.api.dto.problem;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class ProblemSubmissionRequestDto {

    @NotNull(message = "문제 ID는 필수입니다.")
    private Long problemId;

    @NotBlank(message = "제출 코드는 필수입니다.")
    private String code;

    @NotBlank(message = "프로그래밍 언어는 필수입니다.")
    private String language;
} 