package com.snippethub.api.service;

import com.snippethub.api.domain.Like;
import com.snippethub.api.domain.User;
import com.snippethub.api.domain.Post;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.repository.LikeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LikeService {
    private final LikeRepository likeRepository;

    public LikeService(LikeRepository likeRepository) {
        this.likeRepository = likeRepository;
    }

    @Transactional
    public void likePost(User user, Post post) {
        if (!likeRepository.existsByUserIdAndPostId(user.getId(), post.getId())) {
            Like like = Like.builder().user(user).post(post).build();
            likeRepository.save(like);
        }
    }

    @Transactional
    public void unlikePost(User user, Post post) {
        likeRepository.deleteByUserIdAndPostId(user.getId(), post.getId());
    }

    @Transactional
    public void likeSnippet(User user, Snippet snippet) {
        if (!likeRepository.existsByUserIdAndSnippetId(user.getId(), snippet.getId())) {
            Like like = Like.builder().user(user).snippet(snippet).build();
            likeRepository.save(like);
        }
    }

    @Transactional
    public void unlikeSnippet(User user, Snippet snippet) {
        likeRepository.deleteByUserIdAndSnippetId(user.getId(), snippet.getId());
    }

    public boolean isPostLikedByUser(User user, Post post) {
        return likeRepository.existsByUserIdAndPostId(user.getId(), post.getId());
    }

    public boolean isSnippetLikedByUser(User user, Snippet snippet) {
        return likeRepository.existsByUserIdAndSnippetId(user.getId(), snippet.getId());
    }
} 