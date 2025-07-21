package com.snippethub.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExecutionRequest {

    @NotBlank(message = "언어는 필수입니다.")
    private String language;

    @NotBlank(message = "코드는 필수입니다.")
    @Size(min = 1, max = 50000, message = "코드는 1자 이상 50000자 이하로 입력해주세요.")
    private String code;

    private String input;

    private Long snippetId;
}

