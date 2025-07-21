package com.snippethub.api.dto.snippet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
public class SnippetUpdateRequestDto {

    @NotBlank(message = "제목은 필수입니다.")
    @Size(min = 1, max = 100, message = "제목은 1자 이상 100자 이하로 입력해주세요.")
    private String title;

    @NotBlank(message = "설명은 필수입니다.")
    @Size(min = 1, max = 2000, message = "설명은 1자 이상 2000자 이하로 입력해주세요.")
    private String description;

    @NotBlank(message = "언어는 필수입니다.")
    private String language;

    @NotBlank(message = "코드는 필수입니다.")
    @Size(min = 1, max = 50000, message = "코드는 1자 이상 50000자 이하로 입력해주세요.")
    private String code;

    @Size(max = 5, message = "태그는 최대 5개까지 가능합니다.")
    private List<String> tags;

    private boolean isPublic;

    private List<MultipartFile> files;
}
