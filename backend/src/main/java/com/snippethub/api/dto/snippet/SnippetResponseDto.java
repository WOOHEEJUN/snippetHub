package com.snippethub.api.dto.snippet;

import com.snippethub.api.domain.Snippet;
import com.snippethub.api.dto.user.UserDto;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class SnippetResponseDto {

    private final Long snippetId;
    private final String title;
    private final String description;
    private final String language;
    private final String code;
    private final List<String> tags;
    private final UserDto author;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final int viewCount;
    private final int likeCount;
    private final int commentCount;
    private final int runCount;
    private final boolean isPublic;

    public SnippetResponseDto(Snippet snippet) {
        this.snippetId = snippet.getId();
        this.title = snippet.getTitle();
        this.description = snippet.getDescription();
        this.language = snippet.getLanguage();
        this.code = snippet.getCode();
        // this.tags = snippet.getTags(); // TODO: Implement Tag system
        this.tags = List.of();
        this.author = new UserDto(snippet.getAuthor());
        this.createdAt = snippet.getCreatedAt();
        this.updatedAt = snippet.getUpdatedAt();
        this.viewCount = snippet.getViewCount();
        this.likeCount = snippet.getLikeCount();
        this.commentCount = snippet.getCommentCount();
        this.runCount = snippet.getRunCount();
        this.isPublic = snippet.isPublic();
    }
}
