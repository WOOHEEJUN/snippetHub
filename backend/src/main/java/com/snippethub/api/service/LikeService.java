package com.snippethub.api.service;

import com.snippethub.api.domain.Like;
import com.snippethub.api.domain.Post;
import com.snippethub.api.domain.Snippet;
import com.snippethub.api.domain.User;
import com.snippethub.api.exception.BusinessException;
import com.snippethub.api.exception.ErrorCode;
import com.snippethub.api.repository.LikeRepository;
import com.snippethub.api.repository.PostRepository;
import com.snippethub.api.repository.SnippetRepository;
import com.snippethub.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LikeService {

    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final SnippetRepository snippetRepository;

    @Transactional
    public boolean toggleLikeForPost(Long postId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        return likeRepository.findByUserIdAndPostId(user.getId(), postId).map(existingLike -> {
            likeRepository.delete(existingLike);
            post.decreaseLikeCount(); // TODO: Implement decreaseLikeCount method in Post entity
            return false; // 좋아요 취소
        }).orElseGet(() -> {
            Like newLike = Like.builder().user(user).post(post).build();
            likeRepository.save(newLike);
            post.increaseLikeCount(); // TODO: Implement increaseLikeCount method in Post entity
            return true; // 좋아요 추가
        });
    }

    @Transactional
    public boolean toggleLikeForSnippet(Long snippetId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Snippet snippet = snippetRepository.findById(snippetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SNIPPET_NOT_FOUND));

        return likeRepository.findByUserIdAndSnippetId(user.getId(), snippetId).map(existingLike -> {
            likeRepository.delete(existingLike);
            snippet.decreaseLikeCount(); // TODO: Implement decreaseLikeCount method in Snippet entity
            return false; // 좋아요 취소
        }).orElseGet(() -> {
            Like newLike = Like.builder().user(user).snippet(snippet).build();
            likeRepository.save(newLike);
            snippet.increaseLikeCount(); // TODO: Implement increaseLikeCount method in Snippet entity
            return true; // 좋아요 추가
        });
    }
}