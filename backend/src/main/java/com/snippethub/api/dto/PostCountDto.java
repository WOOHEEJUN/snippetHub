package com.snippethub.api.dto;

import lombok.Data;

@Data
public class PostCountDto {
    private long totalPosts;
    private long freePosts;
    private long snippetPosts;
} 