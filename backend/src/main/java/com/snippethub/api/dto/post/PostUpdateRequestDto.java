package com.snippethub.api.dto.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PostUpdateRequestDto {

    @NotBlank(message = "제목은 필수입니다.")
    @Size(min = 1, max = 100, message = "제목은 1자 이상 100자 이하로 입력해주세요.")
    private String title;

    @NotBlank(message = "내용은 필수입니다.")
    @Size(min = 1, max = 10000, message = "내용은 1자 이상 10000자 이하로 입력해주세요.")
    private String content;

    @NotBlank(message = "카테고리는 필수입니다.")
    private String category;

    @Size(max = 5, message = "태그는 최대 5개까지 가능합니다.")
    private List<String> tags;

    private boolean isPublic;
}
