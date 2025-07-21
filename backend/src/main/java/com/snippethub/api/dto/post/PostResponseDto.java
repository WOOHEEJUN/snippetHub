package com.snippethub.api.dto.post;

import com.snippethub.api.domain.Post;
import com.snippethub.api.dto.user.UserDto;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class PostResponseDto {

    private final Long postId;
    private final String title;
    private final String content;
    private final String category;
    private final List<String> tags;
    private final UserDto author;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final int viewCount;
    private final int likeCount;
    private final int commentCount;

    public PostResponseDto(Post post) {
        this.postId = post.getId();
        this.title = post.getTitle();
        this.content = post.getContent();
        this.category = post.getCategory();
        // this.tags = post.getTags(); // TODO: Implement Tag system
        this.tags = List.of();
        this.author = new UserDto(post.getAuthor());
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
        this.viewCount = post.getViewCount();
        this.likeCount = post.getLikeCount();
        this.commentCount = post.getCommentCount();
    }
}
