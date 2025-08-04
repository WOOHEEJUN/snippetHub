package com.snippethub.api.dto.comment;

import com.snippethub.api.domain.Comment;
import com.snippethub.api.dto.user.UserDto;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CommentResponseDto {

    private final Long commentId;
    private final String content;
    private final UserDto author;
    private final LocalDateTime createdAt;

    public CommentResponseDto(Comment comment) {
        this.commentId = comment.getId();
        this.content = comment.getContent();
        this.author = new UserDto(comment.getAuthor());
        this.createdAt = comment.getCreatedAt();
    }
}
