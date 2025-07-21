package com.snippethub.api.dto.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentUpdateRequestDto {

    @NotBlank(message = "댓글 내용은 필수입니다.")
    @Size(min = 1, max = 1000, message = "댓글 내용은 1자 이상 1000자 이하로 입력해주세요.")
    private String content;
}
