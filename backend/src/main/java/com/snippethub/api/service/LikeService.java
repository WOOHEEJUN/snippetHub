package com.snippethub.api.service;

import com.snippethub.api.domain.Like;
import com.snippethub.api.domain.Notification;
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
    private final NotificationService notificationService;

    @Transactional
    public boolean toggleLikeForPost(Long postId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        return likeRepository.findByUserIdAndPostId(user.getId(), postId).map(existingLike -> {
            likeRepository.delete(existingLike);
            post.decreaseLikeCount();
            return false; // 좋아요 취소
        }).orElseGet(() -> {
            Like newLike = Like.builder().user(user).post(post).build();
            likeRepository.save(newLike);
            post.increaseLikeCount();

            // 알림 생성
            if (!post.getAuthor().getId().equals(user.getId())) { // 본인 게시물에 좋아요는 알림 X
                String message = String.format("%s님이 회원님의 게시물 \"%s\"에 좋아요를 눌렀습니다.", user.getNickname(), post.getTitle());
                notificationService.createNotification(
                    post.getAuthor(), 
                    message,
                    com.snippethub.api.domain.NotificationType.LIKE,
                    "POST",
                    post.getId(), // 게시글 ID
                    null         // 부모 ID 없음
                );
            }
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
            snippet.decreaseLikeCount();
            return false; // 좋아요 취소
        }).orElseGet(() -> {
            Like newLike = Like.builder().user(user).snippet(snippet).build();
            likeRepository.save(newLike);
            snippet.increaseLikeCount();

            // 알림 생성
            if (!snippet.getAuthor().getId().equals(user.getId())) { // 본인 스니펫에 좋아요는 알림 X
                String message = String.format("%s님이 회원님의 스니펫 \"%s\"에 좋아요를 눌렀습니다.", user.getNickname(), snippet.getTitle());
                notificationService.createNotification(
                    snippet.getAuthor(), 
                    message,
                    com.snippethub.api.domain.NotificationType.LIKE,
                    "SNIPPET",
                    snippet.getId(), // 스니펫 ID
                    null           // 부모 ID 없음
                );
            }
            return true; // 좋아요 추가
        });
    }
}